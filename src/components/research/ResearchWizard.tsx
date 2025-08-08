import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { researchService } from '@/services/research/researchService';
import type { 
  ResearchSession, 
  WizardStep, 
  TopicInputForm, 
  ResearchParameters,
  CostEstimate,
  ResearchStatus
} from '@/types/research';

// Step components
import { ResearchSetupStep } from './steps/ResearchSetupStep';
import { ProcessingStep } from './steps/ProcessingStep';
import { ResultsStep } from './steps/ResultsStep';

// Navigation component
import { WizardNavigation } from './WizardNavigation';

// Progress component
import { ProgressIndicator } from './ProgressIndicator';

// Error boundary
import ResearchErrorBoundary from './ResearchErrorBoundary';

interface ResearchWizardProps {
  initialTopic?: string;
  onComplete?: (session: ResearchSession) => void;
}

const ResearchWizard: React.FC<ResearchWizardProps> = ({ 
  initialTopic, 
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // State for form validation
  const [step1Topic, setStep1Topic] = useState("");

  // Stable callback for config updates - defined at top level to prevent hook violations
  const handleConfigUpdate = React.useCallback((config: any) => {
    // Handle config update
    setStep1Topic(config.topic || "");
  }, []);

  // Handle session creation - memoized to prevent infinite loops in useEffect
  const handleCreateSession = React.useCallback(async (formData: TopicInputForm) => {
    setIsLoading(true);
    
    try {
      const parameters: ResearchParameters = {
        researchType: formData?.researchType || 'custom',
        depth: formData?.depth || 'comprehensive',
        focusAreas: formData?.focusAreas || [],
        outputFormat: 'detailed',
        outputLength: 'comprehensive',
        includeSourceData: true,
        targetAudience: 'executives',
        timeframe: formData?.timeframe || '6-months'
      };

      const result = await researchService.createSession(
        `Research: ${(formData?.topic || '').slice(0, 50)}...`,
        formData?.topic || '',
        parameters
      );

      if (result.success && result.data) {
        setSession(result.data);
        toast({
          title: "Research Session Created",
          description: `Estimated cost: $${result.data.estimatedCost.expectedCost.toFixed(4)}`,
        });
      } else {
        throw new Error(result.error?.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('Session creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create research session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initialize session if we have an initial topic
  useEffect(() => {
    if (initialTopic && !session) {
      handleCreateSession({
        topic: initialTopic,
        researchType: 'custom',
        depth: 'comprehensive',
        focusAreas: []
      });
    }
  }, [initialTopic, session, handleCreateSession]);

  // Wizard steps configuration
  const steps: WizardStep[] = [
    {
      id: 1,
      title: 'Research Setup',
      description: 'Define your research topic and parameters',
      component: 'ResearchSetupStep',
      status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'pending',
      isClickable: true,
      isValid: step1Topic.trim().length >= 10 || !!session?.topic
    },
    {
      id: 2,
      title: 'AI Processing',
      description: 'Claude and OpenAI analyze your research topic',
      component: 'ProcessingStep',
      status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'pending',
      isClickable: currentStep >= 2 || (currentStep > 2),
      isValid: session?.status === 'completed'
    },
    {
      id: 3,
      title: 'Results & Export',
      description: 'Review analysis and export your research',
      component: 'ResultsStep',
      status: currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : 'pending',
      isClickable: currentStep >= 3,
      isValid: session?.results && (session.results.claude || session.results.openai)
    }
  ];

  // Handle step navigation
  const handleStepNavigation = (targetStep: number) => {
    if (targetStep === currentStep) return;
    
    // Validate current step before moving
    const currentStepData = steps.find(s => s.id === currentStep);
    if (targetStep > currentStep && !currentStepData?.isValid) {
      toast({
        title: "Step Incomplete",
        description: "Please complete the current step before proceeding",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep(targetStep);
  };

  // Handle next step
  const handleNext = async () => {
    const nextStep = Math.min(currentStep + 1, steps.length);
    
    // Special handling for step transitions
    if (currentStep === 1 && session) {
      // Moving from setup to processing - validate and confirm cost
      const costConfirmed = await confirmCost(session.estimatedCost);
      if (!costConfirmed) return;
      
      // Update session status
      setSession(prev => prev ? { ...prev, status: 'processing', currentStep: 2 } : null);
    }
    
    setCurrentStep(nextStep);
  };

  // Handle previous step
  const handleBack = () => {
    const prevStep = Math.max(currentStep - 1, 1);
    setCurrentStep(prevStep);
  };

  // Confirm cost before processing
  const confirmCost = async (estimate: CostEstimate): Promise<boolean> => {
    return new Promise((resolve) => {
      const confirmed = window.confirm(
        `This research will cost approximately $${estimate.expectedCost.toFixed(4)} ` +
        `(range: $${estimate.minCost.toFixed(4)} - $${estimate.maxCost.toFixed(4)}). ` +
        `Do you want to proceed?`
      );
      resolve(confirmed);
    });
  };

  // Handle research completion
  const handleResearchComplete = (updatedSession: ResearchSession) => {
    setSession(updatedSession);
    setCurrentStep(3);
    
    if (onComplete) {
      onComplete(updatedSession);
    }
  };

  // Render current step component
  const renderStepComponent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ResearchSetupStep
            session={session}
            onNext={handleNext}
            onCancel={() => navigate('/admin')}
            onConfigUpdate={handleConfigUpdate}
          />
        );
        
      case 2:
        return (
          <ProcessingStep
            session={session}
            onNext={() => setCurrentStep(3)}
            onPrevious={() => setCurrentStep(1)}
            onCancel={() => navigate('/admin')}
            onSessionUpdate={(updates) => {
              console.log('ResearchWizard - Session update received:', updates);
              console.log('ResearchWizard - Previous session:', session);
              
              setSession(prev => {
                // CRITICAL FIX: Handle undefined prev by creating new session with updates
                const updated = prev ? { ...prev, ...updates } : { 
                  id: 'generated-' + Date.now(),
                  title: 'AI Research Session',
                  topic: '',
                  status: 'setup' as ResearchStatus,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  ...updates 
                };
                console.log('ResearchWizard - Updated session:', updated);
                return updated;
              });
              
              if (updates.status === 'completed' && session) {
                const completedSession = { ...session, ...updates };
                console.log('ResearchWizard - Completed session:', completedSession);
                handleResearchComplete(completedSession);
              }
            }}
          />
        );
        
      case 3:
        return (
          <ResultsStep
            session={session}
            onExport={(format) => {
              toast({
                title: "Export Started",
                description: `Exporting results in ${format.toUpperCase()} format...`,
              });
            }}
            onNewResearch={() => {
              setSession(null);
              setCurrentStep(1);
            }}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <ResearchErrorBoundary
      onReset={() => {
        setSession(null);
        setCurrentStep(1);
      }}
      onRetry={() => {
        window.location.reload();
      }}
    >
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/admin')}
                className="text-sm"
              >
                ← Back to Admin
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Research Comparator</h1>
                <p className="text-sm text-gray-600">Compare Claude and OpenAI research analysis</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Step {currentStep} of {steps.length}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'lg:grid-cols-4 gap-8'}`}>
          {/* Navigation Sidebar (Desktop) or Progress Bar (Mobile) */}
          {isMobile ? (
            <div className="lg:hidden">
              <ProgressIndicator
                currentStep={currentStep}
                totalSteps={steps.length}
                stepTitles={steps.map(s => s.title)}
                onStepClick={handleStepNavigation}
                canNavigate={(step) => steps.find(s => s.id === step)?.isClickable || false}
              />
            </div>
          ) : (
            <div className="lg:col-span-1">
              <WizardNavigation
                steps={steps}
                currentStep={currentStep}
                onStepClick={handleStepNavigation}
                session={session}
              />
            </div>
          )}

          {/* Main Content Area */}
          <div className={`${isMobile ? 'col-span-1' : 'lg:col-span-3'}`}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">
                      {steps.find(s => s.id === currentStep)?.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {steps.find(s => s.id === currentStep)?.description}
                    </p>
                  </div>
                  {session?.estimatedCost && (
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Estimated Cost</div>
                      <div className="text-lg font-semibold text-purple-600">
                        ${session.estimatedCost.expectedCost.toFixed(4)}
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {renderStepComponent()}
                
                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  
                  {currentStep < steps.length && (
                    <Button
                      onClick={handleNext}
                      disabled={!steps.find(s => s.id === currentStep)?.isValid || isLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {currentStep === 1 ? 'Start Research' : 'Next'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </ResearchErrorBoundary>
  );
};

export default ResearchWizard;