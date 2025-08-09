import * as React from "react";
import { Sparkles, Target, DollarSign, Lightbulb, Search, BookOpen, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ResearchStepProps, 
  ResearchConfig, 
  SampleTopic, 
  TopicCategory, 
  CostEstimate 
} from "@/types/research";
import { supabase } from '@/integrations/supabase/client';

interface ResearchSetupStepProps extends ResearchStepProps {
  onConfigUpdate: (config: ResearchConfig) => void;
}

const ResearchSetupStep: React.FC<ResearchSetupStepProps> = ({
  session,
  onNext,
  onCancel,
  onConfigUpdate,
  className
}) => {
  const [topic, setTopic] = React.useState(session?.topic || "");
  const [optimizedPrompt, setOptimizedPrompt] = React.useState(session?.optimizedPrompt || "");
  const [hasError, setHasError] = React.useState(false);
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [showSamples, setShowSamples] = React.useState(false);
  const [systemPrompt, setSystemPrompt] = React.useState(`You are an expert research prompt optimizer. Your task is to transform user research topics into comprehensive, structured research prompts that will generate high-quality analytical content.

When given a research topic, enhance it by:
1. Adding specific analytical frameworks and methodologies
2. Including key areas of investigation (market analysis, trends, competitive landscape, etc.)
3. Requesting structured output with clear sections
4. Ensuring data-driven insights and actionable recommendations
5. Specifying the target audience and depth of analysis

Make the prompt comprehensive but focused, ensuring it will generate professional research-grade content.`);
  
  // Update parent when topic changes - memoized to prevent infinite loops
  const currentConfig = React.useMemo(() => ({
    topic: optimizedPrompt || topic,
    optimizedPrompt: optimizedPrompt || undefined,
    systemPrompt: systemPrompt,
    maxTokens: 4000,
    temperature: 0.7,
    providers: ['claude', 'openai'] as const
  }), [topic, optimizedPrompt, systemPrompt]);

  React.useEffect(() => {
    onConfigUpdate(currentConfig);
  }, [currentConfig, onConfigUpdate]);
  const [costEstimate, setCostEstimate] = React.useState<CostEstimate>({
    minCost: 0.045,
    maxCost: 0.065,
    expectedCost: 0.055,
    currency: 'USD',
    breakdown: {
      claude: {
        minCost: 0.020,
        maxCost: 0.030,
        expectedTokens: 3500
      },
      openai: {
        minCost: 0.025,
        maxCost: 0.035,
        expectedTokens: 3500
      }
    },
    confidence: 85,
    basedOnSimilarQueries: 150
  });

  const sampleTopics: SampleTopic[] = [
    {
      id: "1",
      title: "Digital Marketing ROI Analysis",
      description: "Comprehensive analysis of digital marketing return on investment strategies",
      category: "marketing",
      estimatedCost: 0.045,
      complexity: "intermediate",
      keywords: ["roi", "digital marketing", "analytics", "conversion"],
      prompt: "Analyze digital marketing ROI strategies, including attribution models, conversion tracking, and budget optimization techniques.",
      expectedOutput: "Detailed analysis covering measurement frameworks, tools, and best practices"
    },
    {
      id: "2", 
      title: "Sustainable Finance Trends",
      description: "Current trends and future outlook for sustainable and ESG investing",
      category: "finance",
      estimatedCost: 0.052,
      complexity: "advanced",
      keywords: ["esg", "sustainable finance", "green bonds", "impact investing"],
      prompt: "Examine the latest trends in sustainable finance, ESG investing strategies, and regulatory developments.",
      expectedOutput: "Comprehensive overview of ESG investment landscape and future opportunities"
    },
    {
      id: "3",
      title: "AI in Healthcare Applications",
      description: "Current applications and future potential of AI in healthcare delivery",
      category: "healthcare",
      estimatedCost: 0.048,
      complexity: "advanced",
      keywords: ["ai", "healthcare", "medical diagnosis", "telemedicine"],
      prompt: "Analyze current AI applications in healthcare, including diagnostic tools, treatment planning, and patient care optimization.",
      expectedOutput: "Detailed examination of AI healthcare solutions and implementation challenges"
    },
    {
      id: "4",
      title: "Remote Work Productivity",
      description: "Best practices and tools for maintaining productivity in remote work environments",
      category: "business",
      estimatedCost: 0.038,
      complexity: "beginner",
      keywords: ["remote work", "productivity", "collaboration", "work-life balance"],
      prompt: "Research best practices for remote work productivity, including tools, processes, and team management strategies.",
      expectedOutput: "Practical guide with actionable recommendations for remote work success"
    },
    {
      id: "5",
      title: "Quantum Computing Business Impact",
      description: "Business applications and implications of quantum computing technology",
      category: "technology", 
      estimatedCost: 0.065,
      complexity: "advanced",
      keywords: ["quantum computing", "business applications", "cybersecurity", "optimization"],
      prompt: "Examine the business impact of quantum computing, including near-term applications, industry disruption, and strategic considerations.",
      expectedOutput: "Strategic analysis of quantum computing's business potential and timeline"
    }
  ];

  const categoryIcons: Record<TopicCategory, React.ReactNode> = {
    finance: <DollarSign className="w-4 h-4" />,
    technology: <Target className="w-4 h-4" />,
    business: <BookOpen className="w-4 h-4" />,
    marketing: <Search className="w-4 h-4" />,
    healthcare: <Target className="w-4 h-4" />,
    education: <BookOpen className="w-4 h-4" />,
    sustainability: <Target className="w-4 h-4" />,
    general: <Lightbulb className="w-4 h-4" />
  };

  const getCategoryTopics = (category: TopicCategory) => 
    sampleTopics.filter(topic => topic.category === category);

  const handleTopicChange = React.useCallback((value: string) => {
    setTopic(value);
    
    // Update cost estimate based on topic length
    const baseLength = 100;
    const lengthFactor = Math.max(1, value.length / baseLength);
    setCostEstimate(prev => ({
      ...prev,
      claude: Math.round(0.025 * lengthFactor * 1000) / 1000,
      openai: Math.round(0.030 * lengthFactor * 1000) / 1000,
      total: Math.round((0.025 + 0.030) * lengthFactor * 1000) / 1000
    }));
  }, []);

  const handleSampleTopicSelect = React.useCallback((sampleTopic: SampleTopic) => {
    setTopic(sampleTopic.prompt);
    setCostEstimate({
      claude: sampleTopic.estimatedCost * 0.45,
      openai: sampleTopic.estimatedCost * 0.55,
      total: sampleTopic.estimatedCost,
      currency: 'USD'
    });
  }, []);

  const handleOptimizePrompt = React.useCallback(async () => {
    if (!topic.trim()) return;
    
    setIsOptimizing(true);
    setHasError(false);
    
    try {
      // Use the same pattern as the successful translation service
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required for prompt optimization');
      }

      // Call the ai-research-claude edge function directly
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-research-claude`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt: systemPrompt,
          userPrompt: `Please optimize this research topic into a comprehensive research prompt:

Topic: "${topic.trim()}"

Transform this into a detailed research prompt that will generate a thorough analysis with clear structure, data-driven insights, and actionable recommendations.`,
          maxTokens: 1000,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success && result.content) {
        setOptimizedPrompt(result.content.trim());
      } else {
        throw new Error(result.error || 'Failed to get optimized prompt from API');
      }
      
    } catch (error) {
      console.error('Prompt optimization error:', error);
      
      // Use a well-structured fallback that works
      const fallbackOptimized = `Analyze the following topic comprehensively: "${topic}"

Please provide a detailed research report including:

1. Executive Summary
   - Key findings and insights
   - Main conclusions

2. Market Analysis
   - Current market size and trends
   - Key players and competition
   - Growth opportunities

3. Detailed Analysis
   - Core challenges and pain points
   - Emerging trends and patterns
   - Future projections

4. Strategic Recommendations
   - Actionable next steps
   - Implementation strategies
   - Success metrics

5. Supporting Evidence
   - Relevant data and statistics
   - Industry benchmarks
   - Case studies if applicable

Ensure all insights are data-driven and provide specific, actionable recommendations.`;
      
      setOptimizedPrompt(fallbackOptimized);
    }
    
    setIsOptimizing(false);
  }, [topic, systemPrompt]);

  const handleNext = React.useCallback(() => {
    const config: ResearchConfig = {
      topic: optimizedPrompt || topic,
      optimizedPrompt: optimizedPrompt || undefined,
      systemPrompt: systemPrompt,
      maxTokens: 4000,
      temperature: 0.7,
      providers: ['claude', 'openai']
    };
    
    onConfigUpdate(config);
    onNext?.();
  }, [topic, optimizedPrompt, systemPrompt, onConfigUpdate, onNext]);

  const isValidTopic = topic.trim().length >= 10 && topic.trim().length <= 1000;
  const charCount = topic.length;
  const charLimit = 1000;

  // Render error state if needed
  const renderContent = () => {
    if (hasError) {
      return (
        <div className="text-center p-8">
          <div className="text-red-600 mb-4">
            Service temporarily unavailable. Please try again in a moment.
          </div>
          <Button 
            onClick={() => setHasError(false)} 
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return (
      <>
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Research Setup
          </h2>
          <p className="text-muted-foreground">
            Define your research topic and let AI generate comprehensive insights
          </p>
        </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Topic Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Research Topic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="topic-input" className="text-sm font-medium">
                Describe what you want to research
              </Label>
              <Textarea
                id="topic-input"
                placeholder="Example: Analyze the impact of artificial intelligence on the financial services industry, including current applications, future trends, and regulatory considerations..."
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="mt-2 min-h-[120px] resize-none"
                maxLength={charLimit}
                aria-describedby="topic-help char-count"
              />
              
              <div className="flex justify-between items-center mt-2">
                <p id="topic-help" className="text-xs text-muted-foreground">
                  Be specific and detailed for better results. Minimum 10 characters.
                </p>
                <span 
                  id="char-count"
                  className={cn(
                    "text-xs",
                    charCount > charLimit * 0.9 ? "text-orange-600" : "text-muted-foreground"
                  )}
                >
                  {charCount}/{charLimit}
                </span>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-3">
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Advanced Settings</h4>
                  <p className="text-xs text-muted-foreground">
                    Customize the AI system prompt for optimization
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </Button>
              </div>

              {showAdvanced && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <Label htmlFor="system-prompt" className="text-sm font-medium">
                      System Prompt
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Define how the AI should optimize your research prompts. This controls the optimization behavior.
                    </p>
                    <Textarea
                      id="system-prompt"
                      placeholder="Enter custom system prompt for AI optimization..."
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="min-h-[160px] resize-none font-mono text-xs"
                      maxLength={2000}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-muted-foreground">
                        Controls how AI optimizes your prompts
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {systemPrompt.length}/2000
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSystemPrompt(`You are an expert research prompt optimizer. Your task is to transform user research topics into comprehensive, structured research prompts that will generate high-quality analytical content.

When given a research topic, enhance it by:
1. Adding specific analytical frameworks and methodologies
2. Including key areas of investigation (market analysis, trends, competitive landscape, etc.)
3. Requesting structured output with clear sections
4. Ensuring data-driven insights and actionable recommendations
5. Specifying the target audience and depth of analysis

Make the prompt comprehensive but focused, ensuring it will generate professional research-grade content.`)}
                    >
                      Reset to Default
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Optimization */}
            {topic.trim().length >= 10 && (
              <div className="space-y-3">
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Prompt Optimization</h4>
                    <p className="text-xs text-muted-foreground">
                      Enhance your prompt for better AI results
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOptimizePrompt}
                    disabled={isOptimizing || hasError}
                  >
                    {isOptimizing ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Optimize
                      </>
                    )}
                  </Button>
                </div>

                {optimizedPrompt && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">
                      Optimized Prompt:
                    </h5>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">
                      {optimizedPrompt}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sample Topics - Collapsed by Default */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-4 h-4" />
                Need Ideas?
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSamples(!showSamples)}
                className="text-sm"
              >
                {showSamples ? 'Hide Examples' : 'Show Examples'}
              </Button>
            </div>
          </CardHeader>
          {showSamples && (
            <CardContent>
              <div className="space-y-3">
                {sampleTopics.slice(0, 3).map((sampleTopic) => (
                  <div
                    key={sampleTopic.id} 
                    className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      handleSampleTopicSelect(sampleTopic);
                      setShowSamples(false);
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-sm">{sampleTopic.title}</h4>
                      <span className="text-xs text-gray-500">
                        ${sampleTopic.estimatedCost.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {sampleTopic.description}
                    </p>
                  </div>
                ))}
                <p className="text-xs text-gray-500 text-center pt-2">
                  Click any example to use as your starting point
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Simple Cost Display */}
        {isValidTopic && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Estimated cost: <span className="font-semibold text-gray-900">${costEstimate.total.toFixed(3)}</span>
            </p>
          </div>
        )}

        {/* Validation Messages */}
        {topic.trim().length > 0 && !isValidTopic && (
          <Alert variant="destructive">
            <AlertDescription>
              {topic.trim().length < 10 
                ? "Topic must be at least 10 characters long for meaningful research."
                : "Topic is too long. Please keep it under 1000 characters."
              }
            </AlertDescription>
          </Alert>
        )}
      </div>
      </>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {renderContent()}
    </div>
  );
};

ResearchSetupStep.displayName = "ResearchSetupStep";

export { ResearchSetupStep };