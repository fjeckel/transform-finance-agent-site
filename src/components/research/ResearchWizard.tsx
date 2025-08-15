import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Menu, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { researchService } from '@/services/research/researchService';
import type { 
  ResearchSession, 
  WizardStep, 
  TopicInputForm, 
  ResearchParameters,
  CostEstimate,
  ResearchStatus,
  ResearchTaskType
} from '@/types/research';

// Step components
import { ResearchSetupStep } from './steps/ResearchSetupStep';
import { ProcessingStep } from './steps/ProcessingStep';
import { ResultsStep } from './steps/ResultsStep';

// Error boundary
import ResearchErrorBoundary from './ResearchErrorBoundary';

// Sidebar
import { ResearchSidebar } from './sidebar/ResearchSidebar';
import type { ResearchSessionSummary } from './sidebar/types';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // State for form validation
  const [step1Topic, setStep1Topic] = useState("");

  // Stable callback for config updates - defined at top level to prevent hook violations
  const handleConfigUpdate = React.useCallback((config: any) => {
    // Handle config update
    setStep1Topic(config.topic || "");
  }, []);

  // Handle session creation - memoized to prevent infinite loops in useEffect
  const handleCreateSession = React.useCallback(async (formData?: TopicInputForm | null) => {
    setIsLoading(true);
    
    try {
      // Defensive parameter creation with full type safety
      const safeFormData = formData || {};
      const parameters: ResearchParameters = {
        researchType: (safeFormData.researchType as ResearchTaskType) || 'custom',
        depth: safeFormData.depth || 'comprehensive',
        focusAreas: safeFormData.focusAreas || [],
        outputFormat: 'detailed',
        outputLength: 'comprehensive',
        includeSourceData: true,
        targetAudience: 'executives',
        timeframe: '6-months'
      };

      const result = await researchService.createSession(
        `Research: ${(safeFormData.topic || '').slice(0, 50)}...`,
        safeFormData.topic || '',
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
    if (currentStep === 1) {
      // Create or update session when moving from setup to processing
      if (!session && step1Topic.trim()) {
        // Create new session with the topic from step 1
        const newSession: ResearchSession = {
          id: 'generated-' + Date.now(),
          title: `Research: ${step1Topic.slice(0, 50)}...`,
          topic: step1Topic,
          status: 'processing',
          currentStep: 2,
          totalSteps: 3,
          parameters: {
            researchType: 'custom',
            depth: 'comprehensive',
            focusAreas: [],
            outputFormat: 'detailed',
            outputLength: 'comprehensive',
            includeSourceData: true,
            targetAudience: 'executives'
          },
          estimatedCost: {
            minCost: 0.045,
            maxCost: 0.065,
            expectedCost: 0.055,
            currency: 'USD',
            breakdown: {
              claude: { minCost: 0.020, maxCost: 0.030, expectedTokens: 3500 },
              openai: { minCost: 0.025, maxCost: 0.035, expectedTokens: 3500 }
            },
            confidence: 85,
            basedOnSimilarQueries: 150
          },
          totalCost: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'anonymous',
          isPublic: false
        };
        
        // Confirm cost before proceeding
        const costConfirmed = await confirmCost(newSession.estimatedCost);
        if (!costConfirmed) return;
        
        setSession(newSession);
      } else if (session) {
        // Update existing session
        const costConfirmed = await confirmCost(session.estimatedCost);
        if (!costConfirmed) return;
        
        // Update session status and ensure topic is set
        setSession(prev => prev ? { 
          ...prev, 
          status: 'processing', 
          currentStep: 2,
          topic: prev.topic || step1Topic || '',
          updatedAt: new Date()
        } : null);
      }
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

  // Sidebar handlers
  const handleSessionSelect = (sessionSummary: ResearchSessionSummary) => {
    // Convert session summary to full session for the wizard
    const fullSession: ResearchSession = {
      id: sessionSummary.id,
      title: sessionSummary.session_title,
      topic: '', // Will be loaded from database
      status: sessionSummary.status === 'completed' ? 'completed' : 'setup',
      currentStep: sessionSummary.status === 'completed' ? 3 : 1,
      totalSteps: 3,
      parameters: {
        researchType: sessionSummary.research_type as any,
        depth: 'comprehensive',
        focusAreas: [],
        outputFormat: 'detailed',
        outputLength: 'comprehensive',
        includeSourceData: true,
        targetAudience: 'executives'
      },
      estimatedCost: {
        minCost: 0.03,
        maxCost: 0.08,
        expectedCost: sessionSummary.estimated_cost_usd,
        currency: 'USD',
        breakdown: {
          claude: { minCost: 0.015, maxCost: 0.04, expectedTokens: 3000 },
          openai: { minCost: 0.015, maxCost: 0.04, expectedTokens: 3000 }
        },
        confidence: 80,
        basedOnSimilarQueries: 100
      },
      totalCost: sessionSummary.actual_cost_usd || 0,
      createdAt: new Date(sessionSummary.created_at),
      updatedAt: new Date(sessionSummary.updated_at),
      userId: '', // Will be filled from auth
      isPublic: false
    };

    setSession(fullSession);
    setCurrentStep(fullSession.currentStep);
    
    // Close sidebar on mobile
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleNewSession = async (): Promise<ResearchSession | null> => {
    try {
      const result = await researchService.createSession(
        'New Research Session',
        'Enter your research topic here...',
        {
          researchType: 'custom',
          depth: 'comprehensive',
          focusAreas: [],
          outputFormat: 'detailed',
          outputLength: 'comprehensive',
          includeSourceData: true,
          targetAudience: 'executives'
        }
      );

      if (result.success && result.data) {
        setSession(result.data);
        setCurrentStep(1);
        
        // Close sidebar on mobile
        if (isMobile) {
          setSidebarOpen(false);
        }
        
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error creating new session:', error);
      return null;
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
                if (!prev) {
                  const newSession: ResearchSession = { 
                    id: 'generated-' + Date.now(),
                    title: 'AI Research Session',
                    topic: updates.optimizedPrompt || step1Topic || '',
                    status: (updates.status as ResearchStatus) || 'setup',
                    currentStep: 2,
                    totalSteps: 3,
                    parameters: {
                      researchType: 'custom',
                      depth: 'comprehensive',
                      focusAreas: [],
                      outputFormat: 'detailed',
                      outputLength: 'comprehensive',
                      includeSourceData: true,
                      targetAudience: 'executives'
                    },
                    estimatedCost: {
                      minCost: 0.045,
                      maxCost: 0.065,
                      expectedCost: 0.055,
                      currency: 'USD',
                      breakdown: {
                        claude: { minCost: 0.020, maxCost: 0.030, expectedTokens: 3500 },
                        openai: { minCost: 0.025, maxCost: 0.035, expectedTokens: 3500 }
                      },
                      confidence: 85,
                      basedOnSimilarQueries: 150
                    },
                    totalCost: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    userId: 'anonymous',
                    isPublic: false,
                    ...updates 
                  };
                  console.log('ResearchWizard - Created new session:', newSession);
                  return newSession;
                }
                
                const updated = { ...prev, ...updates, updatedAt: new Date() };
                console.log('ResearchWizard - Updated session:', updated);
                return updated;
              });
              
              if (updates.status === 'completed') {
                // Use the updated session for completion handling
                setSession(currentSession => {
                  if (currentSession) {
                    const completedSession = { ...currentSession, ...updates };
                    console.log('ResearchWizard - Completed session:', completedSession);
                    handleResearchComplete(completedSession);
                  }
                  return currentSession;
                });
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
            onSessionUpdate={(updates) => {
              console.log('ResearchWizard - ResultsStep session update:', updates);
              setSession(prev => prev ? { ...prev, ...updates } : null);
            }}
            onReprocess={() => {
              console.log('ResearchWizard - Reprocessing requested');
              setCurrentStep(2); // Go back to processing step
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
      <div className="flex h-screen bg-gray-50">
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={() => setSidebarOpen(false)} 
          />
        )}

        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300' : 'w-80'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        `}>
          <ResearchSidebar
            currentSessionId={session?.id}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
            className="h-full"
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="bg-white border-b">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-4">
                {/* Mobile menu button */}
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                    className="p-2"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                
                <div>
                  <h1 className="text-xl font-bold text-gray-900 font-cooper">
                    {session?.title || 'AI Research Analysis'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Step {currentStep} of {steps.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {session?.estimatedCost && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Estimated Cost</div>
                    <div className="text-sm font-semibold text-purple-600">
                      ${session.estimatedCost.expectedCost.toFixed(4)}
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/admin')}
                >
                  ← Back to Admin
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {steps[currentStep - 1]?.title}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round((currentStep / steps.length) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#13B87B] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-cooper">
                        {steps.find(s => s.id === currentStep)?.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {steps.find(s => s.id === currentStep)?.description}
                      </p>
                    </div>
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
                        className="bg-[#13B87B] hover:bg-[#0FA66A] text-white"
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