import * as React from "react";
import { Sparkles, Target, DollarSign, Lightbulb, Search, BookOpen } from "lucide-react";
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
import { useResearchService } from "@/hooks/useResearchService";

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
  
  // Use the research service hook for better production stability
  const { executeClaudeResearch, isAvailable } = useResearchService();
  
  // Update parent when topic changes - memoized to prevent infinite loops
  const currentConfig = React.useMemo(() => ({
    topic: optimizedPrompt || topic,
    optimizedPrompt: optimizedPrompt || undefined,
    maxTokens: 4000,
    temperature: 0.7,
    providers: ['claude', 'openai'] as const
  }), [topic, optimizedPrompt]);

  React.useEffect(() => {
    onConfigUpdate(currentConfig);
  }, [currentConfig, onConfigUpdate]);
  const [costEstimate, setCostEstimate] = React.useState<CostEstimate>({
    claude: 0.025,
    openai: 0.030,
    total: 0.055,
    currency: 'USD'
  });
  const [isOptimizing, setIsOptimizing] = React.useState(false);

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
    
    try {
      // Use the hook-provided method for better stability
      if (!executeClaudeResearch || !isAvailable) {
        throw new Error('Research service not available. Please try again later.');
      }
      
      const result = await executeClaudeResearch({
        sessionId: session?.id || 'temp',
        prompt: `You are an expert research prompt optimizer. Transform this user research topic into a comprehensive, structured research prompt:

Topic: "${topic.trim()}"

Enhance it by:
1. Adding specific analytical frameworks and methodologies
2. Including key areas of investigation (market analysis, trends, competitive landscape, etc.)  
3. Requesting structured output with clear sections
4. Ensuring data-driven insights and actionable recommendations
5. Specifying the target audience and depth of analysis

Return only the optimized prompt, make it comprehensive but focused.`,
        maxTokens: 1000,
        temperature: 0.7
      });
      
      if (result.success && result.response) {
        setOptimizedPrompt(result.response.trim());
      } else {
        throw new Error(result.error || 'Failed to get optimized prompt from API');
      }
      
    } catch (error) {
      console.error('Prompt optimization error:', error);
      setHasError(true);
      
      // Reset error after a delay to allow retry
      setTimeout(() => setHasError(false), 5000);
      
      // Fallback to enhanced static version
      const optimized = `Conduct a comprehensive research analysis on: ${topic}

Please provide:

1. **Executive Summary**: Key findings and insights overview

2. **Current Market Analysis**: 
   - Market size and growth trends
   - Key players and competitive landscape
   - Current market dynamics

3. **Trend Analysis**:
   - Emerging trends and patterns
   - Historical context and evolution
   - Future trajectory indicators

4. **Strategic Insights**:
   - Opportunities and challenges
   - Risk factors and mitigation strategies
   - Success factors and best practices

5. **Actionable Recommendations**:
   - Strategic recommendations
   - Implementation considerations
   - Expected outcomes and metrics

6. **Data-Driven Evidence**:
   - Relevant statistics and metrics
   - Industry benchmarks
   - Supporting research and sources

Please structure the response with clear headings, bullet points where appropriate, and ensure all insights are supported by evidence and analysis.`;
      
      setOptimizedPrompt(optimized);
    }
    
    setIsOptimizing(false);
  }, [topic, session?.id]);

  const handleNext = React.useCallback(() => {
    const config: ResearchConfig = {
      topic: optimizedPrompt || topic,
      optimizedPrompt: optimizedPrompt || undefined,
      maxTokens: 4000,
      temperature: 0.7,
      providers: ['claude', 'openai']
    };
    
    onConfigUpdate(config);
    onNext?.();
  }, [topic, optimizedPrompt, onConfigUpdate, onNext]);

  const isValidTopic = topic.trim().length >= 10 && topic.trim().length <= 1000;
  const charCount = topic.length;
  const charLimit = 1000;

  return (
    <div className={cn("space-y-6", className)}>
      {hasError ? (
        // Error state - service temporarily unavailable
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
      ) : (
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

        {/* Sample Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Sample Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="finance" className="w-full">
              <TabsList className="grid grid-cols-4 lg:grid-cols-6 mb-4">
                <TabsTrigger value="finance" className="text-xs">Finance</TabsTrigger>
                <TabsTrigger value="technology" className="text-xs">Tech</TabsTrigger>
                <TabsTrigger value="business" className="text-xs">Business</TabsTrigger>
                <TabsTrigger value="marketing" className="text-xs">Marketing</TabsTrigger>
                <TabsTrigger value="healthcare" className="text-xs lg:block hidden">Health</TabsTrigger>
                <TabsTrigger value="general" className="text-xs lg:block hidden">General</TabsTrigger>
              </TabsList>

              {Object.entries(categoryIcons).map(([category, icon]) => (
                <TabsContent key={category} value={category} className="space-y-3">
                  {getCategoryTopics(category as TopicCategory).map((sampleTopic) => (
                    <Card 
                      key={sampleTopic.id} 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleSampleTopicSelect(sampleTopic)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{sampleTopic.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {sampleTopic.complexity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ~${sampleTopic.estimatedCost.toFixed(3)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {sampleTopic.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Cost Estimate */}
        {isValidTopic && (
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  Estimated cost: <strong>${costEstimate.total.toFixed(3)} USD</strong>
                </span>
                <div className="text-xs text-muted-foreground">
                  Claude: ${costEstimate.claude.toFixed(3)} • 
                  OpenAI: ${costEstimate.openai.toFixed(3)}
                </div>
              </div>
            </AlertDescription>
          </Alert>
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
      )}
    </div>
  );
};

ResearchSetupStep.displayName = "ResearchSetupStep";

export { ResearchSetupStep };