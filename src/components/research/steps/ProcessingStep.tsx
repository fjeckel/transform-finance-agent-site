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
import { supabase } from '@/integrations/supabase/client';

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
  const isProcessingRef = React.useRef<boolean>(false);

  // Real AI processing function
  const executeAIResearch = React.useCallback(async (
    provider: AIProvider,
    setProgress: (progress: ProcessingProgress) => void,
    setStatus: (status: AIResultStatus) => void
  ) => {
    setStatus('processing');
    
    // Stage 1: Initializing
    setProgress({
      provider,
      stage: 'initializing',
      percentage: 0,
      message: 'Connecting to API and preparing request...',
      timestamp: new Date()
    });

    if (!isProcessingRef.current) return;

    try {
      // Get authentication session
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        throw new Error('Authentication required');
      }

      setProgress({
        provider,
        stage: 'initializing',
        percentage: 25,
        message: 'Authentication validated, preparing research prompt...',
        timestamp: new Date()
      });

      if (!isProcessingRef.current) return;

      // Stage 2: Processing with real AI (long-running)
      setProgress({
        provider,
        stage: 'processing',
        percentage: 30,
        message: `${provider === 'claude' ? 'Claude' : 'OpenAI'} is conducting deep research analysis...`,
        timestamp: new Date()
      });

      // Prepare the research prompt
      const systemPrompt = session?.systemPrompt || `You are an expert research analyst. Provide comprehensive, well-structured analysis on the given topic with actionable insights and data-driven recommendations.`;
      const userPrompt = session?.optimizedPrompt || session?.topic || 'Please provide a comprehensive research analysis.';

      // Set up progress tracking for long-running AI call (15-20 minutes)
      const progressMessages = [
        'Analyzing core concepts and frameworks...',
        'Researching market trends and data points...',
        'Evaluating competitive landscape...',
        'Synthesizing insights and recommendations...',
        'Structuring comprehensive analysis...',
        'Finalizing research findings...',
        'Quality checking analysis depth...'
      ];
      
      let progressIndex = 0;
      let currentPercentage = 35;
      
      // Start periodic progress updates during AI processing
      const progressInterval = setInterval(() => {
        if (!isProcessingRef.current) {
          clearInterval(progressInterval);
          return;
        }
        
        // Gradually increase progress over ~18 minutes (until 90%)
        currentPercentage = Math.min(90, currentPercentage + 1);
        const messageIndex = Math.floor(progressIndex / 60) % progressMessages.length; // Change message every minute
        
        setProgress({
          provider,
          stage: 'processing',
          percentage: currentPercentage,
          message: `${provider === 'claude' ? 'Claude' : 'OpenAI'}: ${progressMessages[messageIndex]}`,
          timestamp: new Date()
        });
        
        progressIndex++;
      }, 3000); // Update every 3 seconds

      // Call the appropriate edge function
      const functionName = provider === 'claude' ? 'ai-research-claude' : 'ai-research-openai';
      
      let response;
      try {
        response = await fetch(`https://aumijfxmeclxweojrefa.supabase.co/functions/v1/${functionName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authSession.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            systemPrompt,
            userPrompt,
            maxTokens: 4000,
            temperature: 0.7
          })
        });

        // Clear the progress interval once API call completes
        clearInterval(progressInterval);

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        setProgress({
          provider,
          stage: 'processing',
          percentage: 95,
          message: 'Processing comprehensive AI response...',
          timestamp: new Date()
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'AI processing failed');
        }

        // Stage 3: Finalizing
        setProgress({
          provider,
          stage: 'finalizing',
          percentage: 95,
          message: 'Formatting response and calculating costs...',
          timestamp: new Date()
        });

        if (!isProcessingRef.current) return;

        setProgress({
          provider,
          stage: 'finalizing',
          percentage: 100,
          message: 'Analysis completed successfully!',
          timestamp: new Date()
        });

        // Generate the AI result
        const aiResult: AIResult = {
          provider,
          content: result.content || 'Analysis completed',
          metadata: {
            model: provider === 'claude' ? 'claude-3-5-sonnet' : 'gpt-4-turbo',
            tokensUsed: result.tokensUsed || 0,
            cost: result.cost || 0,
            processingTime: result.processingTime || (Date.now() - (startTimeRef.current?.getTime() || 0)),
            finishReason: 'stop'
          },
          timestamp: new Date(),
          status: 'completed'
        };

        setStatus('completed');
        return aiResult;
        
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
      
    } catch (error) {
      console.error(`${provider} research error:`, error);
      setStatus('failed');
      
      // Set error progress state
      setProgress({
        provider,
        stage: 'initializing',
        percentage: 0,
        message: `${provider} analysis failed. Please try again.`,
        timestamp: new Date()
      });
      
      throw error;
    }

  }, [session?.topic, session?.systemPrompt, session?.optimizedPrompt]);

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
    isProcessingRef.current = true;
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
      // Process both providers in parallel with real AI calls
      const [claudeResult, openaiResult] = await Promise.allSettled([
        executeAIResearch('claude', setClaudeProgress, setClaudeStatus),
        executeAIResearch('openai', setOpenaiProgress, setOpenaiStatus)
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
      isProcessingRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [onSessionUpdate, executeAIResearch]);

  const handleStopProcessing = React.useCallback(() => {
    setIsProcessing(false);
    isProcessingRef.current = false;
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
        <p className="text-muted-foreground mb-3">
          Dual AI analysis in progress - Claude and OpenAI working in parallel
        </p>
        
        {/* Processing time warning */}
        {!isProcessing && session?.status !== 'completed' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-amber-800">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Deep Research Analysis</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              This comprehensive analysis takes 15-20 minutes. Both AI models will conduct thorough research with detailed insights.
            </p>
          </div>
        )}
        
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-blue-800">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Analysis in Progress</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Please keep this tab open. Deep analysis typically takes 15-20 minutes to complete.
            </p>
          </div>
        )}
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