import * as React from "react";
import { Play, Pause, Square, RefreshCw, AlertTriangle, CheckCircle, Clock, MessageCircle, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  ResearchError,
  ResponseClassification
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
  const [isEditingPrompt, setIsEditingPrompt] = React.useState(false);
  const [editablePrompt, setEditablePrompt] = React.useState(session?.optimizedPrompt || session?.topic || "");
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

  const [grokProgress, setGrokProgress] = React.useState<ProcessingProgress>({
    provider: 'grok',
    stage: 'initializing',
    percentage: 0,
    message: 'Preparing request...',
    timestamp: new Date()
  });

  const [claudeStatus, setClaudeStatus] = React.useState<AIResultStatus>('pending');
  const [openaiStatus, setOpenaiStatus] = React.useState<AIResultStatus>('pending');
  const [grokStatus, setGrokStatus] = React.useState<AIResultStatus>('pending');
  const [processingTime, setProcessingTime] = React.useState<number>(0);
  const [error, setError] = React.useState<ResearchError | null>(null);

  const startTimeRef = React.useRef<Date>();
  const timerRef = React.useRef<NodeJS.Timeout>();
  const isProcessingRef = React.useRef<boolean>(false);

  // Early clarification detection
  const detectVaguePrompt = React.useCallback((topic: string): boolean => {
    const lowerTopic = topic.toLowerCase();
    const vagueIndicators = [
      'research', 'analyze', 'study', 'investigate', 'explore',
      'tell me about', 'what is', 'how to', 'help me',
      'general', 'basic', 'simple', 'overview'
    ];
    
    // Check for very short prompts or generic terms
    const isShort = topic.trim().length < 50;
    const hasVagueTerms = vagueIndicators.some(indicator => 
      lowerTopic.includes(indicator) && lowerTopic.split(' ').length < 10
    );
    
    return isShort || hasVagueTerms;
  }, []);

  const topicNeedsClarification = React.useMemo(() => {
    const topic = session?.optimizedPrompt || session?.topic || "";
    return detectVaguePrompt(topic);
  }, [session?.topic, session?.optimizedPrompt, detectVaguePrompt]);

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

    if (!isProcessingRef.current) {
      console.log(`${provider} - Processing cancelled at start`);
      return null;
    }

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

      if (!isProcessingRef.current) {
        console.log(`${provider} - Processing cancelled after auth`);
        return null;
      }

      // Stage 2: Processing with real AI (long-running)
      setProgress({
        provider,
        stage: 'processing',
        percentage: 30,
        message: `${provider === 'claude' ? 'Claude' : 'OpenAI'} is conducting deep research analysis...`,
        timestamp: new Date()
      });

      // Prepare the research prompt - prioritize optimized prompt, then topic, with fallback
      const systemPrompt = session?.systemPrompt || `You are an elite research analyst and strategic consultant with deep expertise across multiple industries and analytical frameworks. Your task is to conduct comprehensive, professional-grade research analysis that would typically require weeks of work from a research team.

ANALYSIS FRAMEWORK:
1. **Market Intelligence**: Analyze current market size, growth rates, key trends, disruption factors
2. **Competitive Landscape**: Identify major players, market positioning, competitive advantages/disadvantages  
3. **Stakeholder Analysis**: Map key stakeholders, their interests, influence, and impact
4. **Risk Assessment**: Evaluate strategic, operational, financial, and regulatory risks
5. **Opportunity Identification**: Pinpoint emerging opportunities, market gaps, growth vectors
6. **Data-Driven Insights**: Include relevant statistics, forecasts, and quantitative analysis where possible
7. **Strategic Recommendations**: Provide actionable, prioritized recommendations with implementation roadmaps

RESEARCH DEPTH REQUIREMENTS:
- Go beyond surface-level analysis - dig into underlying drivers and root causes
- Consider multiple perspectives and scenarios (bull/bear cases)
- Include forward-looking analysis and trend forecasting
- Address potential challenges and mitigation strategies
- Provide specific, measurable, and time-bound recommendations

OUTPUT STRUCTURE:
Your analysis must be comprehensive (2000-4000 words) and structured as:
- Executive Summary (key findings & recommendations)
- Market Context & Background
- Detailed Analysis (multiple sections as relevant)
- Risk Assessment & Mitigation
- Strategic Opportunities
- Implementation Roadmap
- Conclusion & Next Steps

Use professional consulting language, include specific examples, and ensure all insights are actionable and valuable for executive decision-making.`;
      const userPrompt = (session?.optimizedPrompt && session.optimizedPrompt.trim()) 
        ? session.optimizedPrompt 
        : (session?.topic && session.topic.trim())
        ? session.topic
        : 'Please provide a comprehensive research analysis.';

      // Debug logging to track what prompt is being sent
      console.log(`ProcessingStep - Sending to ${provider}:`, {
        sessionTopic: session?.topic,
        sessionOptimizedPrompt: session?.optimizedPrompt,
        finalUserPrompt: userPrompt,
        promptLength: userPrompt.length
      });

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
      const functionName = provider === 'claude' ? 'ai-research-claude' : 
                          provider === 'openai' ? 'ai-research-openai' : 'ai-research-grok';
      
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
        
        console.log(`${provider} API response:`, result);
        
        if (!result.success) {
          console.error(`${provider} API error:`, result.error);
          throw new Error(result.error || 'AI processing failed');
        }
        
        if (!result.content) {
          console.error(`${provider} returned empty content:`, result);
          throw new Error(`${provider} returned empty content`);
        }

        // Stage 3: Finalizing
        setProgress({
          provider,
          stage: 'finalizing',
          percentage: 95,
          message: 'Formatting response and calculating costs...',
          timestamp: new Date()
        });

        if (!isProcessingRef.current) {
          console.log(`${provider} - Processing cancelled by user`);
          return null;
        }

        setProgress({
          provider,
          stage: 'finalizing',
          percentage: 100,
          message: 'Analysis completed successfully!',
          timestamp: new Date()
        });

        // Validate result content before creating AIResult
        if (!result.content || result.content.trim().length === 0) {
          console.error(`${provider} returned empty or invalid content:`, result);
          throw new Error(`${provider} returned empty or invalid content`);
        }
        
        console.log(`${provider} - Creating AIResult with content length:`, result.content.length);
        
        // Classify the response
        const classification = classifyResponse(result.content);
        console.log(`${provider} - Response classification:`, classification);
        
        // Generate the AI result
        const aiResult: AIResult = {
          provider,
          content: result.content,
          classification,
          metadata: {
            model: provider === 'claude' ? 'claude-3-5-sonnet' : 
                   provider === 'openai' ? 'gpt-4-turbo' : 'grok-4-0709',
            tokensUsed: result.tokensUsed || 0,
            cost: result.cost || 0,
            processingTime: result.processingTime || (Date.now() - (startTimeRef.current?.getTime() || 0)),
            finishReason: 'stop'
          },
          timestamp: new Date(),
          status: classification.type === 'analysis' ? 'completed' : 'needs_clarification'
        };

        setStatus('completed');
        console.log(`${provider} - Returning AIResult:`, aiResult);
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

  // AI-powered comparison analysis function
  const generateComparisonAnalysis = async (results: AIResult[]) => {
    console.log(`Generating AI comparison analysis for ${results.length} providers...`);
    
    const providerNames = results.map(r => r.provider.charAt(0).toUpperCase() + r.provider.slice(1)).join(', ');
    const comparisonSystemPrompt = `You are an expert research analysis evaluator. Your task is to provide a comprehensive comparison and synthesis of ${results.length} AI-generated research reports on the same topic.

ANALYSIS FRAMEWORK:
1. **Content Quality Assessment**: Evaluate depth, accuracy, comprehensiveness, and professional quality
2. **Analytical Rigor**: Compare methodology, data usage, logical reasoning, and evidence quality
3. **Strategic Value**: Assess actionability of recommendations, practical applicability, strategic insight
4. **Coverage Comparison**: Identify what each analysis covers well vs. gaps or weaknesses
5. **Synthesis Opportunities**: Find complementary insights that strengthen overall understanding
6. **Differentiation Analysis**: Highlight unique perspectives, approaches, or insights from each

COMPARISON OUTPUT STRUCTURE:
## Executive Assessment
- Overall quality comparison (scores out of 10 for each provider)
- Best-in-class elements from each analysis
- Combined strategic value proposition

## Detailed Comparison Matrix
- **Depth & Comprehensiveness**: Compare thoroughness and coverage
- **Data & Evidence**: Evaluate use of statistics, examples, case studies
- **Strategic Insights**: Assess quality of recommendations and actionability  
- **Presentation & Clarity**: Compare structure, readability, professional quality
- **Innovation & Perspective**: Unique angles or fresh thinking

## Synthesis & Integration
- **Complementary Strengths**: How the analyses reinforce each other
- **Conflicting Views**: Areas of disagreement and possible resolution
- **Enhanced Recommendations**: Improved insights combining all perspectives
- **Implementation Priorities**: Unified action plan leveraging best of all

## Final Recommendation
- Which analysis is stronger overall and why
- How to best utilize all analyses together
- Key takeaways for decision makers

Provide specific examples and concrete comparisons. Be objective but decisive in your assessment.`;

    // Build dynamic user prompt for all available results
    let userPrompt = `Please analyze and compare these ${results.length} research reports on the same topic:

**RESEARCH TOPIC**: ${session?.topic || session?.optimizedPrompt}

`;

    results.forEach((result) => {
      const providerName = result.provider.toUpperCase();
      userPrompt += `**${providerName} ANALYSIS** (${result.metadata.tokensUsed} tokens, $${result.metadata.cost.toFixed(4)}):
${result.content}

`;
    });

    userPrompt += `Please provide a comprehensive comparison and synthesis following the framework above.`;

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        throw new Error('Authentication required for comparison analysis');
      }

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-research-claude`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt: comparisonSystemPrompt,
          userPrompt: userPrompt,
          maxTokens: 3000,
          temperature: 0.3 // Lower temperature for more consistent analysis
        }),
      });

      if (!response.ok) {
        throw new Error(`Comparison API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.content) {
        return {
          id: `comparison-${Date.now()}`,
          content: result.content,
          metadata: {
            tokensUsed: result.tokensUsed || 0,
            cost: result.cost || 0,
            processingTime: result.processingTime || 0,
            generatedBy: 'claude',
            timestamp: new Date()
          }
        };
      } else {
        throw new Error(result.error || 'Failed to generate comparison');
      }
      
    } catch (error) {
      console.error('Comparison analysis error:', error);
      throw error;
    }
  };

  // Function to classify AI responses
  const classifyResponse = (content: string): ResponseClassification => {
    const questionIndicators = [
      'i\'ll need you to specify',
      'i\'d be happy to',
      'but i\'ll need',
      'please share the specific topic',
      'please provide more details',
      'could you clarify',
      'could you specify',
      'need more information',
      'need specific details',
      'need to know',
      'what specifically',
      'which aspect',
      'which type',
      'can you provide more details',
      'it would be helpful to know',
      'i\'d need to understand',
      'i need to know',
      'i would need specific',
      'before i can analyze',
      'to better assist',
      'to provide a comprehensive',
      'specify the topic',
      'what you want to achieve',
      // CRITICAL ADDITIONS based on actual AI responses
      'to provide a comprehensive research analysis, i would need specific details',
      'i\'d be happy to provide a comprehensive research analysis',
      'i\'ll need you to specify the topic',
      'would need specific details about the topic',
      'need you to specify'
    ];
    
    const partialIndicators = [
      'based on limited information',
      'with the information provided',
      'however, without more context',
      'additional details would',
      'incomplete analysis',
      'i can guide you'
    ];
    
    const lowerContent = content.toLowerCase();
    
    // ENHANCED: Check for the exact patterns from your logs
    const containsClaudePattern = lowerContent.includes('i\'d be happy to provide a comprehensive research analysis') ||
                                 lowerContent.includes('i\'ll need you to specify the topic');
    
    const containsOpenAIPattern = lowerContent.includes('to provide a comprehensive research analysis, i would need specific details') ||
                                 lowerContent.includes('would need specific details about the topic you are interested in');
    
    // Check for explicit request patterns (ENHANCED)
    const hasExplicitRequest = lowerContent.includes('please share') || 
                               lowerContent.includes('please provide') ||
                               lowerContent.includes('please specify') ||
                               (lowerContent.includes('i\'ll need') && lowerContent.includes('specify')) ||
                               (lowerContent.includes('i would need') && lowerContent.includes('specific')) ||
                               containsClaudePattern ||
                               containsOpenAIPattern;
    
    // Count question indicators
    const questionCount = questionIndicators.filter(indicator => 
      lowerContent.includes(indicator)
    ).length;
    
    // Count partial indicators
    const partialCount = partialIndicators.filter(indicator => 
      lowerContent.includes(indicator)
    ).length;
    
    // Extract questions (sentences ending with ?)
    const questions = content.match(/[^.!?]*\?/g) || [];
    
    // Check if response is asking for topic clarification
    const askingForTopic = (lowerContent.includes('topic') && 
                          (lowerContent.includes('specify') || 
                           lowerContent.includes('provide') || 
                           lowerContent.includes('share') ||
                           lowerContent.includes('need'))) ||
                          containsClaudePattern ||
                          containsOpenAIPattern;
    
    // ENHANCED: More aggressive detection for clarification requests
    const shortResponse = content.length < 500; // Clarification requests are typically short
    const containsNeed = lowerContent.includes('need') && (lowerContent.includes('specific') || lowerContent.includes('details'));
    const containsWould = lowerContent.includes('would need') || lowerContent.includes('i would');
    
    console.log('Classification Debug:', {
      contentLength: content.length,
      shortResponse,
      hasExplicitRequest,
      askingForTopic,
      questionCount,
      questionsLength: questions.length,
      containsClaudePattern,
      containsOpenAIPattern,
      containsNeed,
      containsWould
    });
    
    // ENHANCED: Lower threshold for detecting questions
    if (hasExplicitRequest || 
        askingForTopic || 
        (shortResponse && containsNeed) ||
        (shortResponse && containsWould) ||
        questionCount >= 1 || 
        questions.length >= 1 ||
        containsClaudePattern ||
        containsOpenAIPattern) {
      
      // Extract key requests from the content
      const detectedQuestions = [];
      if (lowerContent.includes('topic')) {
        detectedQuestions.push('What specific topic would you like me to research?');
      }
      if (lowerContent.includes('objective')) {
        detectedQuestions.push('What is your research objective?');
      }
      if (questions.length > 0) {
        detectedQuestions.push(...questions.slice(0, 3).map(q => q.trim()));
      }
      if (detectedQuestions.length === 0) {
        detectedQuestions.push('Please provide more specific details about your research topic');
      }
      
      return {
        type: 'question',
        confidence: hasExplicitRequest || askingForTopic || containsClaudePattern || containsOpenAIPattern ? 0.95 : 0.85,
        detectedQuestions
      };
    }
    
    if (partialCount >= 1 || (questionCount === 1 && questions.length >= 1)) {
      return {
        type: 'partial',
        confidence: Math.min(0.8, (partialCount + questionCount) * 0.25),
        detectedQuestions: questions.map(q => q.trim()),
        missingInfo: partialIndicators.filter(indicator => 
          lowerContent.includes(indicator)
        )
      };
    }
    
    return {
      type: 'analysis',
      confidence: 0.9
    };
  };

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
      // Process all three providers in parallel with real AI calls
      const [claudeResult, openaiResult, grokResult] = await Promise.allSettled([
        executeAIResearch('claude', setClaudeProgress, setClaudeStatus),
        executeAIResearch('openai', setOpenaiProgress, setOpenaiStatus),
        executeAIResearch('grok', setGrokProgress, setGrokStatus)
      ]);

      // Debug Promise.allSettled results
      console.log('Claude Promise.allSettled result:', claudeResult);
      console.log('OpenAI Promise.allSettled result:', openaiResult);
      console.log('Grok Promise.allSettled result:', grokResult);
      
      const results = {
        claude: claudeResult.status === 'fulfilled' && claudeResult.value ? claudeResult.value : undefined,
        openai: openaiResult.status === 'fulfilled' && openaiResult.value ? openaiResult.value : undefined,
        grok: grokResult.status === 'fulfilled' && grokResult.value ? grokResult.value : undefined
      };
      
      // Check if we have at least one result
      if (!results.claude && !results.openai && !results.grok) {
        console.error('No results from any AI provider');
        throw new Error('No results from any AI provider - processing may have been cancelled');
      }
      
      // Additional debugging for rejected promises
      if (claudeResult.status === 'rejected') {
        console.error('Claude research failed:', claudeResult.reason);
      }
      if (openaiResult.status === 'rejected') {
        console.error('OpenAI research failed:', openaiResult.reason);
      }
      if (grokResult.status === 'rejected') {
        console.error('Grok research failed:', grokResult.reason);
      }

      const totalCost = (results.claude?.metadata.cost || 0) + (results.openai?.metadata.cost || 0) + (results.grok?.metadata.cost || 0);

      // Debug logging to identify the issue
      console.log('Processing completed - Results:', results);
      console.log('Claude result:', results.claude);
      console.log('OpenAI result:', results.openai);

      // Generate AI-powered comparison analysis if we have at least two results
      let comparisonAnalysis = null;
      const availableResults = [results.claude, results.openai, results.grok].filter(Boolean);
      if (availableResults.length >= 2) {
        console.log(`${availableResults.length} results available - generating AI comparison analysis...`);
        try {
          // Pass all available results for comprehensive comparison
          comparisonAnalysis = await generateComparisonAnalysis(availableResults);
          console.log('Comparison analysis generated:', comparisonAnalysis);
        } catch (compError) {
          console.warn('Failed to generate comparison analysis:', compError);
        }
      }
      console.log('Total cost:', totalCost);
      
      // Check if any results need clarification
      const needsClarification = 
        (results.claude?.classification?.type !== 'analysis') ||
        (results.openai?.classification?.type !== 'analysis') ||
        (results.grok?.classification?.type !== 'analysis');
      
      onSessionUpdate({
        status: 'completed' as ResearchStatus,
        results,
        comparison: comparisonAnalysis,
        totalCost: totalCost + (comparisonAnalysis?.metadata.cost || 0),
        processingTime: Date.now() - (startTimeRef.current?.getTime() || 0),
        needsClarification,
        clarificationStatus: needsClarification ? 'pending' : 'none',
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
    setGrokStatus('pending');
    setError(null);
    setProcessingTime(0);
    handleStartProcessing();
  }, [handleStartProcessing]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const canProceed = session?.status === 'completed' && session?.results && (session.results.claude || session.results.openai || session.results.grok);
  
  // Debug canProceed logic
  console.log('ProcessingStep - canProceed evaluation:', {
    sessionStatus: session?.status,
    hasResults: !!session?.results,
    hasClaudeResults: !!session?.results?.claude,
    hasOpenAIResults: !!session?.results?.openai,
    hasGrokResults: !!session?.results?.grok,
    canProceed: canProceed,
    fullResults: session?.results
  });
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-cooper">
          AI Processing
        </h2>
        <p className="text-muted-foreground mb-3">
          Triple AI analysis in progress - Claude, OpenAI, and Grok working in parallel
        </p>
        
        {/* Processing time warning and topic quality check */}
        {!isProcessing && session?.status !== 'completed' && (
          <div className="space-y-3">
            {/* Vague topic warning */}
            {session?.topic && session.topic.trim().length < 50 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-blue-800">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm font-medium">Quick Tip</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Your topic seems brief. AI models may ask for clarification to provide the best analysis. Consider being more specific upfront.
                </p>
              </div>
            )}
            
            {/* Processing time info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Deep Research Analysis</span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                This comprehensive analysis takes 15-20 minutes. Both AI models will conduct thorough research with detailed insights.
              </p>
            </div>
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

      {/* Early Clarification Warning */}
      {topicNeedsClarification && !isProcessing && session?.status !== 'completed' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-blue-800">
                Heads up: Your research topic might benefit from more specificity
              </p>
              <p className="text-sm text-blue-700">
                Based on your topic, the AI models may ask for clarification to provide better results. 
                Consider adding specific details like target audience, time frame, or particular aspects you want analyzed.
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                <MessageCircle className="w-3 h-3" />
                <span>This won't stop the analysis, but more details = better insights</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Editable Research Topic */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Research Topic</CardTitle>
            {!isProcessing && session?.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingPrompt(!isEditingPrompt)}
              >
                {isEditingPrompt ? 'Save Changes' : 'Edit Prompt'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingPrompt ? (
            <div className="space-y-3">
              <Textarea
                value={editablePrompt}
                onChange={(e) => setEditablePrompt(e.target.value)}
                placeholder="Enter your research topic or question..."
                className="min-h-[120px] text-sm"
                disabled={isProcessing}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Be specific for better results</span>
                <span>{editablePrompt.length} characters</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (onSessionUpdate) {
                      onSessionUpdate({
                        topic: editablePrompt,
                        optimizedPrompt: editablePrompt,
                        updatedAt: new Date()
                      });
                    }
                    setIsEditingPrompt(false);
                  }}
                  disabled={!editablePrompt.trim()}
                >
                  Save & Update Research
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditablePrompt(session?.optimizedPrompt || session?.topic || "");
                    setIsEditingPrompt(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {session?.optimizedPrompt || session?.topic || ""}
              </p>
            </div>
          )}
          
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

      {/* Simple Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-[#13B87B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analyzing Your Research Topic
              </h3>
              <p className="text-gray-600 mb-4">
                Claude, OpenAI, and Grok are generating comprehensive analysis
              </p>
              <p className="text-sm text-gray-500">
                This typically takes 15-20 minutes • Elapsed: {formatTime(processingTime)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Summary */}
      {(isProcessing || session?.status === 'completed') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Grok Status */}
          <Card className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Grok Analysis</CardTitle>
                <Badge variant={grokStatus === 'completed' ? 'default' : 
                               grokStatus === 'failed' ? 'destructive' : 'secondary'}>
                  {grokStatus === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {grokStatus === 'failed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {grokStatus === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                  {grokStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={grokProgress.percentage} className="mb-2" />
              <p className="text-xs text-muted-foreground">
                {grokProgress.message}
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

      {/* Simple Success State */}
      {canProceed && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-[#13B87B] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 font-cooper">
                Analysis Complete
              </h3>
              <p className="text-gray-600 mb-4">
                All AI models have finished their research analysis
              </p>
            
              <Button 
                onClick={() => {
                  console.log('PROMINENT View Results button clicked - Session:', session);
                  console.log('PROMINENT View Results button clicked - Results:', session?.results);
                  onNext && onNext();
                }} 
                size="lg"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                🔍 VIEW YOUR RESULTS & COMPARISON
              </Button>
              
              <div className="mt-4 text-sm text-green-600">
                Ready to compare Claude vs OpenAI vs Grok analysis!
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Details Summary (Collapsed) */}
      {session?.status === 'completed' && session?.results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-700">
              Analysis Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
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
                
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-purple-600">
                    {session?.results?.grok ? '✓' : '✗'}
                  </p>
                  <p className="text-sm text-purple-800">Grok Analysis</p>
                  {session?.results?.grok && (
                    <p className="text-xs text-purple-600">
                      ${session?.results?.grok?.metadata?.cost?.toFixed(4)}
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
                  <Button onClick={() => {
                    console.log('View Results button clicked - Session:', session);
                    console.log('View Results button clicked - Results:', session?.results);
                    onNext && onNext();
                  }} size="lg">
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