import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { WizardStep, ResearchSession } from '@/types/research';

interface WizardNavigationProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (step: number) => void;
  session: ResearchSession | null;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  steps,
  currentStep,
  onStepClick,
  session
}) => {
  const getStepIcon = (step: WizardStep) => {
    const iconProps = { size: 20, className: 'flex-shrink-0' };
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle {...iconProps} className="text-green-500" />;
      case 'current':
        return <Clock {...iconProps} className="text-purple-500" />;
      case 'error':
        return <AlertCircle {...iconProps} className="text-red-500" />;
      default:
        return <Circle {...iconProps} className="text-gray-400" />;
    }
  };

  const getStepClasses = (step: WizardStep) => {
    const baseClasses = "p-4 rounded-lg border transition-colors cursor-pointer";
    
    if (step.status === 'current') {
      return `${baseClasses} bg-purple-50 border-purple-200 border-l-4 border-l-purple-500`;
    }
    
    if (step.status === 'completed') {
      return `${baseClasses} bg-green-50 border-green-200 hover:bg-green-100`;
    }
    
    if (step.status === 'error') {
      return `${baseClasses} bg-red-50 border-red-200`;
    }
    
    if (step.isClickable) {
      return `${baseClasses} bg-white border-gray-200 hover:bg-gray-50`;
    }
    
    return `${baseClasses} bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed`;
  };

  const handleStepClick = (step: WizardStep) => {
    if (step.isClickable && step.id !== currentStep) {
      onStepClick(step.id);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Research Progress</h2>
          
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id}>
                <div
                  className={getStepClasses(step)}
                  onClick={() => handleStepClick(step)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {getStepIcon(step)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${
                          step.status === 'current' ? 'text-purple-900' :
                          step.status === 'completed' ? 'text-green-900' :
                          step.status === 'error' ? 'text-red-900' :
                          'text-gray-900'
                        }`}>
                          {step.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          step.status === 'current' ? 'bg-purple-100 text-purple-700' :
                          step.status === 'completed' ? 'bg-green-100 text-green-700' :
                          step.status === 'error' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {step.id}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${
                        step.status === 'current' ? 'text-purple-700' :
                        step.status === 'completed' ? 'text-green-700' :
                        step.status === 'error' ? 'text-red-700' :
                        'text-gray-600'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Connection line between steps */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className={`w-0.5 h-4 ${
                      step.status === 'completed' ? 'bg-green-300' :
                      step.status === 'current' && steps[index + 1].status !== 'pending' ? 'bg-purple-300' :
                      'bg-gray-300'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session Info Card */}
      {session && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3">Session Info</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Topic:</span>
                <span className="font-medium text-right max-w-32 truncate" title={session.topic}>
                  {session.topic}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">
                  {session.parameters?.researchType?.replace('_', ' ') || 'Custom'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Depth:</span>
                <span className="font-medium capitalize">{session.parameters?.depth || 'Standard'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium capitalize px-2 py-1 rounded text-xs ${
                  session.status === 'completed' ? 'bg-green-100 text-green-800' :
                  session.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  session.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {session.status}
                </span>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between font-medium">
                  <span>Est. Cost:</span>
                  <span className="text-purple-600">
                    ${session.estimatedCost.expectedCost.toFixed(4)}
                  </span>
                </div>
                {session.actualCost.totalCost > 0 && (
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Actual Cost:</span>
                    <span className="text-green-600 font-medium">
                      ${session.actualCost.totalCost.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-3">How it Works</h3>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <Circle size={12} className="text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <strong>Setup:</strong> Define your research topic and select parameters like depth and focus areas.
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Clock size={12} className="text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <strong>Processing:</strong> Claude and OpenAI analyze your topic simultaneously for comprehensive insights.
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <CheckCircle size={12} className="text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <strong>Results:</strong> Compare outputs, view analysis, and export in multiple formats.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};