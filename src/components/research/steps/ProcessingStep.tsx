import * as React from "react";
import { Play, Pause, Square, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  DualProcessingAnimation 
} from "../animations/LoadingAnimations";
import { 
  ResearchStepProps, 
  ResearchSession, 
  ProcessingProgress, 
  AIProvider, 
  ProcessingStage, 
  AIResultStatus,
  ResearchStatus,
  AIResult,
  ResearchError
} from "@/types/research";

interface ProcessingStepProps extends ResearchStepProps {
  onSessionUpdate: (updates: Partial<ResearchSession>) => void;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({
  session,
  onNext,
  onPrevious,
  onCancel,
  onSessionUpdate,
  className
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [claudeProgress, setClaudeProgress] = React.useState<ProcessingProgress>({
    provider: 'claude',
    stage: 'initializing',
    percentage: 0,
    message: 'Preparing request...',
    timestamp: new Date()
  });
  
  const [openaiProgress, setOpenaiProgress] = React.useState<ProcessingProgress>({
    provider: 'openai',
    stage: 'initializing',
    percentage: 0,
    message: 'Preparing request...',
    timestamp: new Date()
  });

  const [claudeStatus, setClaudeStatus] = React.useState<AIResultStatus>('pending');
  const [openaiStatus, setOpenaiStatus] = React.useState<AIResultStatus>('pending');
  const [processingTime, setProcessingTime] = React.useState<number>(0);
  const [error, setError] = React.useState<ResearchError | null>(null);

  const startTimeRef = React.useRef<Date>();
  const timerRef = React.useRef<NodeJS.Timeout>();

  // Mock processing simulation
  const simulateProcessing = React.useCallback(async (
    provider: AIProvider,
    setProgress: (progress: ProcessingProgress) => void,
    setStatus: (status: AIResultStatus) => void
  ) => {
    const stages: { stage: ProcessingStage; duration: number; message: string }[] = [
      { 
        stage: 'initializing', 
        duration: 1500, 
        message: 'Connecting to API and validating request...' 
      },
      { 
        stage: 'processing', 
        duration: 8000, 
        message: `${provider === 'claude' ? 'Claude' : 'GPT'} is analyzing your research topic...` 
      },
      { 
        stage: 'finalizing', 
        duration: 1000, 
        message: 'Formatting response and calculating costs...' 
      }
    ];

    setStatus('processing');

    for (const { stage, duration, message } of stages) {
      setProgress({
        provider,
        stage,
        percentage: 0,
        message,
        timestamp: new Date()
      });

      // Simulate progress within each stage
      const steps = 20;
      const stepDuration = duration / steps;
      
      for (let i = 0; i <= steps; i++) {
        if (!isProcessing) break;
        
        const stageProgress = (i / steps) * 100;
        const overallProgress = 
          (stages.indexOf(stages.find(s => s.stage === stage)!) * 100 / stages.length) + 
          (stageProgress / stages.length);

        setProgress({
          provider,
          stage,
          percentage: Math.min(overallProgress, 100),
          message,
          timestamp: new Date()
        });

        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }

    // Simulate random completion or error
    if (Math.random() > 0.1) { // 90% success rate
      setStatus('completed');
      setProgress({
        provider,
        stage: 'finalizing',
        percentage: 100,
        message: 'Analysis completed successfully!',
        timestamp: new Date()
      });

      // Generate mock result
      const mockResult: AIResult = {
        provider,
        content: generateMockContent(provider, session?.topic || ""),
        metadata: {
          model: provider === 'claude' ? 'claude-3-sonnet' : 'gpt-4-turbo',
          tokensUsed: Math.floor(Math.random() * 2000) + 1000,
          cost: Math.random() * 0.05 + 0.01,
          processingTime: Date.now() - (startTimeRef.current?.getTime() || 0),
          finishReason: 'stop'
        },
        timestamp: new Date(),
        status: 'completed'
      };

      return mockResult;
    } else {
      setStatus('failed');
      throw new Error(`${provider} processing failed due to API timeout`);
    }
  }, [isProcessing, session?.topic]);

  const generateMockContent = (provider: AIProvider, topic: string): string => {
    const providerStyle = provider === 'claude' 
      ? "comprehensive and structured analysis"
      : "detailed insights with practical recommendations";
    
    return `# AI Research Analysis: ${topic.slice(0, 50)}...

## Executive Summary
This ${providerStyle} covers the key aspects of your research topic, providing actionable insights and strategic recommendations.

## Key Findings
1. **Current Market Landscape**: Detailed examination of existing conditions
2. **Emerging Trends**: Analysis of developing patterns and future directions  
3. **Strategic Implications**: Business and operational considerations
4. **Risk Assessment**: Potential challenges and mitigation strategies

## Detailed Analysis
[This would contain the full research content based on your specific topic]

## Recommendations
- Prioritize immediate actionable items
- Develop long-term strategic initiatives
- Monitor key performance indicators
- Regular reassessment and adaptation

---
*Analysis generated by ${provider === 'claude' ? 'Claude AI' : 'OpenAI GPT-4'}*`;
  };

  const handleStartProcessing = React.useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    startTimeRef.current = new Date();
    
    onSessionUpdate({ 
      status: 'processing' as ResearchStatus,
      updatedAt: new Date()
    });

    // Start timer
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setProcessingTime(Date.now() - startTimeRef.current.getTime());
      }
    }, 100);

    try {
      // Process both providers in parallel
      const [claudeResult, openaiResult] = await Promise.allSettled([
        simulateProcessing('claude', setClaudeProgress, setClaudeStatus),
        simulateProcessing('openai', setOpenaiProgress, setOpenaiStatus)
      ]);

      const results = {
        claude: claudeResult.status === 'fulfilled' ? claudeResult.value : undefined,
        openai: openaiResult.status === 'fulfilled' ? openaiResult.value : undefined
      };

      const totalCost = (results.claude?.metadata.cost || 0) + (results.openai?.metadata.cost || 0);

      onSessionUpdate({
        status: 'completed' as ResearchStatus,
        results,
        totalCost,
        processingTime: Date.now() - (startTimeRef.current?.getTime() || 0),
        updatedAt: new Date()
      });

    } catch (err) {
      const error: ResearchError = {
        type: 'api_error',
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        timestamp: new Date(),
        recoverable: true,
        retryCount: 0
      };
      
      setError(error);
      onSessionUpdate({ 
        status: 'failed' as ResearchStatus,
        error,
        updatedAt: new Date()
      });
    } finally {
      setIsProcessing(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isProcessing, onSessionUpdate, simulateProcessing]);

  const handleStopProcessing = React.useCallback(() => {
    setIsProcessing(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    onSessionUpdate({ 
      status: 'setup' as ResearchStatus,
      updatedAt: new Date()
    });
  }, [onSessionUpdate]);

  const handleRetryProcessing = React.useCallback(() => {
    setClaudeStatus('pending');
    setOpenaiStatus('pending');
    setError(null);
    setProcessingTime(0);
    handleStartProcessing();
  }, [handleStartProcessing]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const canProceed = session?.status === 'completed' && session?.results;
  const hasError = session?.status === 'failed' || error;

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AI Processing
        </h2>
        <p className="text-muted-foreground">
          Dual AI analysis in progress - Claude and OpenAI working in parallel
        </p>
      </div>

      {/* Research Topic Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Research Topic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {session?.optimizedPrompt || session?.topic || ""}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
            <span>Processing with: Claude & OpenAI</span>
            {processingTime > 0 && (
              <span>Elapsed: {formatTime(processingTime)}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Control Panel */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4">
            {!isProcessing && session?.status !== 'completed' && !hasError && (
              <Button
                onClick={handleStartProcessing}
                size="lg"
                className="min-w-[140px]"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Analysis
              </Button>
            )}

            {isProcessing && (
              <Button
                onClick={handleStopProcessing}
                variant="destructive"
                size="lg"
                className="min-w-[140px]"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Processing
              </Button>
            )}

            {hasError && (
              <Button
                onClick={handleRetryProcessing}
                variant="outline"
                size="lg"
                className="min-w-[140px]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Analysis
              </Button>
            )}

            {session?.status === 'completed' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Analysis Completed</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Animation */}
      {(isProcessing || session?.status === 'completed') && (
        <DualProcessingAnimation
          claudeProgress={{
            stage: claudeProgress.stage,
            progress: claudeProgress.percentage,
            message: claudeProgress.message,
            status: claudeStatus
          }}
          openaiProgress={{
            stage: openaiProgress.stage,
            progress: openaiProgress.percentage,
            message: openaiProgress.message,
            status: openaiStatus
          }}
        />
      )}

      {/* Status Summary */}
      {(isProcessing || session?.status === 'completed') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Claude Status */}
          <Card className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Claude Analysis</CardTitle>
                <Badge variant={claudeStatus === 'completed' ? 'default' : 
                               claudeStatus === 'failed' ? 'destructive' : 'secondary'}>
                  {claudeStatus === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {claudeStatus === 'failed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {claudeStatus === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                  {claudeStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={claudeProgress.percentage} className="mb-2" />
              <p className="text-xs text-muted-foreground">
                {claudeProgress.message}
              </p>
            </CardContent>
          </Card>

          {/* OpenAI Status */}
          <Card className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">OpenAI Analysis</CardTitle>
                <Badge variant={openaiStatus === 'completed' ? 'default' : 
                               openaiStatus === 'failed' ? 'destructive' : 'secondary'}>
                  {openaiStatus === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {openaiStatus === 'failed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {openaiStatus === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                  {openaiStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={openaiProgress.percentage} className="mb-2" />
              <p className="text-xs text-muted-foreground">
                {openaiProgress.message}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {hasError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Processing Error</p>
              <p className="text-sm">{error?.message || session?.error?.message}</p>
              <p className="text-xs text-muted-foreground">
                Don't worry, you can retry the analysis or go back to modify your topic.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Results Summary */}
      {session?.status === 'completed' && session?.results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-700">
              Analysis Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-blue-600">
                    {session?.results?.claude ? '✓' : '✗'}
                  </p>
                  <p className="text-sm text-blue-800">Claude Analysis</p>
                  {session?.results?.claude && (
                    <p className="text-xs text-blue-600">
                      ${session?.results?.claude?.metadata?.cost?.toFixed(4)}
                    </p>
                  )}
                </div>
                
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">
                    {session?.results?.openai ? '✓' : '✗'}
                  </p>
                  <p className="text-sm text-green-800">OpenAI Analysis</p>
                  {session?.results?.openai && (
                    <p className="text-xs text-green-600">
                      ${session?.results?.openai?.metadata?.cost?.toFixed(4)}
                    </p>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-gray-600">
                    {formatTime(processingTime)}
                  </p>
                  <p className="text-sm text-gray-800">Total Time</p>
                  <p className="text-xs text-gray-600">
                    ${session?.totalCost?.toFixed(4) || '0.0000'} total
                  </p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Ready to compare results and export your research!
                </p>
                {canProceed && (
                  <Button onClick={onNext} size="lg">
                    View Results & Comparison
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

ProcessingStep.displayName = "ProcessingStep";

export { ProcessingStep };