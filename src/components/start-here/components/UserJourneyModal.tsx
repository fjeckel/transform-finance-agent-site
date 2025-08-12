'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, ChevronLeft, ChevronRight, Mail, Sparkles } from 'lucide-react';
import { journeySteps, getRecommendedPathFromResponses } from '../data/journeySteps';
import { learningPaths } from '../data/learningPaths';
import { useStartHereAnalytics } from '../hooks/useStartHereAnalytics';
import { UserPathPreferences, UserJourneyStep } from '../types/userProfile';

interface UserJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPathId?: string | null;
  onComplete: (pathId: string, preferences: Partial<UserPathPreferences>) => void;
}

export const UserJourneyModal: React.FC<UserJourneyModalProps> = ({
  isOpen,
  onClose,
  selectedPathId,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recommendedPath, setRecommendedPath] = useState<string | null>(null);

  const {
    trackJourneyStarted,
    trackStepCompleted,
    trackStepSkipped,
    trackJourneyCompleted,
    trackJourneyAbandoned,
    trackEmailCaptured
  } = useStartHereAnalytics();

  const currentStepData = journeySteps[currentStep];
  const totalSteps = journeySteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  useEffect(() => {
    if (isOpen && currentStep === 0) {
      const pathId = selectedPathId || 'personalized';
      trackJourneyStarted(pathId, 'modal_opened');
    }
  }, [isOpen, currentStep, selectedPathId, trackJourneyStarted]);

  const handleStepResponse = useCallback((stepId: string, value: any) => {
    const startTime = Date.now();
    
    setResponses(prev => ({
      ...prev,
      [stepId]: value
    }));

    // Track step completion
    const timeSpent = Date.now() - startTime;
    trackStepCompleted(selectedPathId || 'personalized', stepId, timeSpent, value);
  }, [selectedPathId, trackStepCompleted]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Journey completed - analyze responses and show recommendations
      const recommended = getRecommendedPathFromResponses(responses);
      setRecommendedPath(recommended);
      setShowResults(true);
      
      trackJourneyCompleted(
        selectedPathId || 'personalized', 
        Date.now(), 
        totalSteps, 
        totalSteps
      );
    }
  }, [currentStep, totalSteps, responses, selectedPathId, trackJourneyCompleted]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    trackStepSkipped(
      selectedPathId || 'personalized', 
      currentStepData.id, 
      'user_choice'
    );
    handleNext();
  }, [selectedPathId, currentStepData.id, trackStepSkipped, handleNext]);

  const handleClose = useCallback(() => {
    if (currentStep > 0 && !showResults) {
      trackJourneyAbandoned(
        selectedPathId || 'personalized',
        currentStepData.id,
        'modal_closed',
        Date.now()
      );
    }
    onClose();
    setCurrentStep(0);
    setResponses({});
    setShowResults(false);
    setRecommendedPath(null);
    setEmail('');
  }, [currentStep, showResults, selectedPathId, currentStepData.id, trackJourneyAbandoned, onClose]);

  const handleEmailCapture = useCallback(async () => {
    if (!email || !recommendedPath) return;

    setIsSubmitting(true);
    
    try {
      // Track email capture
      trackEmailCaptured(recommendedPath, 'journey_completion', email);

      // Build preferences object
      const preferences: Partial<UserPathPreferences> = {
        selectedPath: recommendedPath,
        goals: responses.goals_definition || [],
        experienceLevel: responses.experience_level || 'beginner',
        role: responses.role_identification || 'other',
        companySize: responses.company_context,
        timeCommitment: responses.time_commitment || 'moderate',
        learningStyle: responses.learning_preferences || 'mixed',
        primaryChallenges: responses.primary_challenges || [],
        sessionId: `session_${Date.now()}`,
        emailCaptured: true,
        newsletterSubscribed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Complete the journey
      onComplete(recommendedPath, preferences);
      
    } catch (error) {
      console.error('Error completing journey:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, recommendedPath, responses, trackEmailCaptured, onComplete]);

  const renderStepContent = () => {
    if (!currentStepData) return null;

    const currentResponse = responses[currentStepData.id];

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-gray-900">
            {currentStepData.title}
          </h3>
          <p className="text-gray-600 max-w-lg mx-auto">
            {currentStepData.description}
          </p>
        </div>

        <div className="space-y-4">
          {currentStepData.type === 'single_select' && currentStepData.options && (
            <div className="grid gap-3">
              {currentStepData.options.map((option) => (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    currentResponse === option.value 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleStepResponse(currentStepData.id, option.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {option.icon && (
                        <div className="p-2 bg-gray-100 rounded-full">
                          <option.icon className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {option.label}
                        </h4>
                        {option.description && (
                          <p className="text-sm text-gray-600">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {currentStepData.type === 'multi_select' && currentStepData.options && (
            <div className="grid gap-3">
              {currentStepData.options.map((option) => {
                const isSelected = currentResponse?.includes(option.value) || false;
                
                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      const current = currentResponse || [];
                      const updated = isSelected
                        ? current.filter((v: any) => v !== option.value)
                        : [...current, option.value];
                      handleStepResponse(currentStepData.id, updated);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center ${
                          isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-sm" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {option.label}
                          </h4>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {currentStepData.type === 'text_input' && (
            <div className="space-y-4">
              <Input
                placeholder="Deine Antwort..."
                value={currentResponse || ''}
                onChange={(e) => handleStepResponse(currentStepData.id, e.target.value)}
                className="text-center"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!recommendedPath) return null;

    const pathData = learningPaths.find(p => p.id === recommendedPath);
    if (!pathData) return null;

    return (
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            Perfekt! Wir haben deinen idealen Lernpfad gefunden
          </h3>
          <p className="text-gray-600 max-w-lg mx-auto">
            Basierend auf deinen Antworten empfehlen wir dir:
          </p>
        </div>

        <Card className="max-w-lg mx-auto" style={{
          background: `linear-gradient(145deg, white 0%, ${pathData.color}08 100%)`
        }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div 
                className="p-3 rounded-full"
                style={{ background: pathData.gradient }}
              >
                <pathData.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              {pathData.title}
            </h4>
            <p className="text-gray-600 text-sm mb-4">
              {pathData.description}
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>⏱️ {pathData.estimatedTime}</span>
              <span>📚 {pathData.recommendedContent.length} Inhalte</span>
              <span>🎯 {getDifficultyText(pathData.difficulty)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Erhalte personalisierte Empfehlungen per Email:
            </label>
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="deine@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleEmailCapture}
                disabled={!email || isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSubmitting ? (
                  'Verarbeitung...'
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Wir senden dir nur relevante Inhalte. Jederzeit abmeldbar.
          </p>
        </div>
      </div>
    );
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Einsteiger';
      case 'intermediate': return 'Fortgeschritten';
      case 'advanced': return 'Experte';
      default: return difficulty;
    }
  };

  const canProceed = () => {
    if (!currentStepData) return false;
    
    const response = responses[currentStepData.id];
    const validation = currentStepData.validation;
    
    if (validation?.required && !response) return false;
    if (validation?.minSelections && (!response || response.length < validation.minSelections)) return false;
    
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-2 -right-2 h-8 w-8 p-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          {!showResults && (
            <div className="space-y-4">
              <DialogTitle className="text-center">
                Finde deinen perfekten Lernpfad
              </DialogTitle>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Schritt {currentStep + 1} von {totalSteps}</span>
                  <span>~{Math.ceil((totalSteps - currentStep) * 0.5)} Min verbleibend</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="py-6">
          {showResults ? renderResults() : renderStepContent()}
        </div>

        {!showResults && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>

            <div className="flex items-center space-x-2">
              {currentStepData.validation?.required !== true && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-500"
                >
                  Überspringen
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {currentStep === totalSteps - 1 ? 'Ergebnis anzeigen' : 'Weiter'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};