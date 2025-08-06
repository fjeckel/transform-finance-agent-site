import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import type { ProgressIndicatorProps } from '@/types/research';

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepTitles,
  onStepClick,
  canNavigate,
  className = ''
}) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const getStepIcon = (stepNumber: number) => {
    const iconProps = { size: 16, className: 'flex-shrink-0' };
    
    if (stepNumber < currentStep) {
      return <CheckCircle {...iconProps} className="text-green-500" />;
    } else if (stepNumber === currentStep) {
      return <Clock {...iconProps} className="text-purple-500" />;
    } else {
      return <Circle {...iconProps} className="text-gray-400" />;
    }
  };

  const getStepClasses = (stepNumber: number) => {
    const canClick = canNavigate?.(stepNumber) && onStepClick;
    const baseClasses = `flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
      canClick ? 'cursor-pointer hover:bg-gray-100' : ''
    }`;
    
    if (stepNumber === currentStep) {
      return `${baseClasses} bg-purple-50 text-purple-900`;
    }
    
    if (stepNumber < currentStep) {
      return `${baseClasses} bg-green-50 text-green-900`;
    }
    
    return `${baseClasses} text-gray-600`;
  };

  const handleStepClick = (stepNumber: number) => {
    if (canNavigate?.(stepNumber) && onStepClick && stepNumber !== currentStep) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step Indicators - Mobile Horizontal Layout */}
      <div className="flex justify-between items-center space-x-1 overflow-x-auto pb-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const stepTitle = stepTitles[index] || `Step ${stepNumber}`;
          
          return (
            <div
              key={stepNumber}
              className={getStepClasses(stepNumber)}
              onClick={() => handleStepClick(stepNumber)}
            >
              <div className="flex flex-col items-center min-w-0 flex-1">
                {getStepIcon(stepNumber)}
                <span className="text-xs mt-1 text-center truncate w-full">
                  {stepTitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Step Details - Mobile */}
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStepIcon(currentStep)}
            <div>
              <h3 className="font-medium text-sm">
                {stepTitles[currentStep - 1] || `Step ${currentStep}`}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {currentStep === 1 && "Define your research parameters"}
                {currentStep === 2 && "AI providers are analyzing your topic"}
                {currentStep === 3 && "Review and export your research results"}
              </p>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>
    </div>
  );
};