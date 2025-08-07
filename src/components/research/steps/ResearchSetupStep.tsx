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
  const [topic, setTopic] = React.useState(session.topic);
  const [optimizedPrompt, setOptimizedPrompt] = React.useState(session.optimizedPrompt || "");
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
    
    // Mock optimization - in real implementation, this would call an API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const optimized = `Optimized research prompt: ${topic}\n\nProvide a comprehensive analysis including:\n1. Current market overview\n2. Key trends and developments\n3. Future outlook and projections\n4. Actionable insights and recommendations\n\nPlease ensure the response is well-structured with clear sections and data-driven insights.`;
    
    setOptimizedPrompt(optimized);
    setIsOptimizing(false);
  }, [topic]);

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
                    disabled={isOptimizing}
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
    </div>
  );
};

ResearchSetupStep.displayName = "ResearchSetupStep";

export { ResearchSetupStep };