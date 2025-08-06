import * as React from "react";
import { Loader2, Brain, Zap, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingAnimationProps, AIProvider, ProcessingStage, AIResultStatus } from "@/types/research";

const LoadingAnimations: React.FC<LoadingAnimationProps> = ({
  provider,
  stage,
  progress,
  message,
  className
}) => {
  const getProviderInfo = (provider: AIProvider) => {
    switch (provider) {
      case 'claude':
        return {
          name: 'Claude',
          icon: Brain,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          accentColor: 'bg-blue-600'
        };
      case 'openai':
        return {
          name: 'OpenAI',
          icon: Zap,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          accentColor: 'bg-green-600'
        };
      default:
        return {
          name: 'AI',
          icon: Brain,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          accentColor: 'bg-gray-600'
        };
    }
  };

  const getStageInfo = (stage: ProcessingStage) => {
    switch (stage) {
      case 'initializing':
        return {
          label: 'Initializing',
          description: 'Preparing request and optimizing prompt...',
          icon: Clock
        };
      case 'processing':
        return {
          label: 'Processing',
          description: 'AI is analyzing and generating response...',
          icon: Loader2
        };
      case 'finalizing':
        return {
          label: 'Finalizing',
          description: 'Processing response and calculating costs...',
          icon: CheckCircle
        };
      default:
        return {
          label: 'Processing',
          description: 'Working on your request...',
          icon: Loader2
        };
    }
  };

  const providerInfo = getProviderInfo(provider);
  const stageInfo = getStageInfo(stage);
  const ProviderIcon = providerInfo.icon;
  const StageIcon = stageInfo.icon;

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          {/* Provider header */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              providerInfo.bgColor
            )}>
              <ProviderIcon className={cn(
                "w-5 h-5",
                providerInfo.color
              )} />
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900">
                {providerInfo.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stageInfo.label}
              </p>
            </div>
          </div>

          {/* Stage status icon */}
          <div className="flex items-center gap-2">
            <StageIcon className={cn(
              "w-5 h-5",
              stage === 'processing' && "animate-spin",
              providerInfo.color
            )} />
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2 mb-4">
          <Progress 
            value={progress} 
            className="h-2"
            aria-label={`${providerInfo.name} processing progress: ${Math.round(progress)}%`}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stageInfo.description}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {/* Status message */}
        {message && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              {message}
            </p>
          </div>
        )}

        {/* Animated processing indicator */}
        <div className="flex items-center justify-center mt-4">
          <div className="flex gap-1">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  providerInfo.accentColor
                )}
                style={{
                  animationDelay: `${index * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>

        {/* Accessibility */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {providerInfo.name} is {stageInfo.label.toLowerCase()}: {Math.round(progress)}% complete.
          {message && ` Status: ${message}`}
        </div>
      </CardContent>
    </Card>
  );
};

// Dual AI Processing Animation Component
interface DualProcessingAnimationProps {
  claudeProgress: {
    stage: ProcessingStage;
    progress: number;
    message?: string;
    status?: AIResultStatus;
  };
  openaiProgress: {
    stage: ProcessingStage;
    progress: number;
    message?: string;
    status?: AIResultStatus;
  };
  className?: string;
}

const DualProcessingAnimation: React.FC<DualProcessingAnimationProps> = ({
  claudeProgress,
  openaiProgress,
  className
}) => {
  const getStatusIcon = (status?: AIResultStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'timeout':
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Dual AI Processing
        </h2>
        <p className="text-muted-foreground">
          Both AI models are analyzing your research topic in parallel
        </p>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="space-y-4 md:hidden">
        <LoadingAnimations
          provider="claude"
          stage={claudeProgress.stage}
          progress={claudeProgress.progress}
          message={claudeProgress.message}
        />
        
        <LoadingAnimations
          provider="openai"
          stage={openaiProgress.stage}
          progress={openaiProgress.progress}
          message={openaiProgress.message}
        />
      </div>

      {/* Desktop: Side-by-side layout */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-6">
        <div className="relative">
          <LoadingAnimations
            provider="claude"
            stage={claudeProgress.stage}
            progress={claudeProgress.progress}
            message={claudeProgress.message}
          />
          {claudeProgress.status && (
            <div className="absolute -top-2 -right-2">
              {getStatusIcon(claudeProgress.status)}
            </div>
          )}
        </div>
        
        <div className="relative">
          <LoadingAnimations
            provider="openai"
            stage={openaiProgress.stage}
            progress={openaiProgress.progress}
            message={openaiProgress.message}
          />
          {openaiProgress.status && (
            <div className="absolute -top-2 -right-2">
              {getStatusIcon(openaiProgress.status)}
            </div>
          )}
        </div>
      </div>

      {/* Overall progress indicator */}
      <div className="mt-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((claudeProgress.progress + openaiProgress.progress) / 2)}%
            </span>
          </div>
          
          <Progress 
            value={(claudeProgress.progress + openaiProgress.progress) / 2}
            className="h-2"
          />
        </div>
      </div>
    </div>
  );
};

LoadingAnimations.displayName = "LoadingAnimations";
DualProcessingAnimation.displayName = "DualProcessingAnimation";

export { LoadingAnimations, DualProcessingAnimation };