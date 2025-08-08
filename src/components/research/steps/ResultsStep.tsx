import * as React from "react";
import { 
  Download, 
  FileText, 
  Copy, 
  Share2, 
  BarChart3, 
  Eye, 
  EyeOff,
  Scale,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  MessageCircle,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  ResearchStepProps, 
  ResearchResults, 
  AIResult, 
  AIProvider, 
  ExportOptions, 
  ExportFormat,
  ResearchSession
} from "@/types/research";
import { ExportService } from "@/services/export/exportService";

interface ResultsStepProps extends ResearchStepProps {
  onComplete?: (results: ResearchResults) => void;
  onSessionUpdate?: (updates: Partial<ResearchSession>) => void;
  onReprocess?: () => void;
}

const ResultsStep: React.FC<ResultsStepProps> = ({
  session,
  onComplete,
  onSessionUpdate,
  onReprocess,
  className
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = React.useState<string>("claude");
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<ExportFormat>("pdf");
  const [showMetadata, setShowMetadata] = React.useState(false);
  const [showClarificationModal, setShowClarificationModal] = React.useState(false);
  const [clarificationText, setClarificationText] = React.useState("");
  const [isReprocessing, setIsReprocessing] = React.useState(false);

  const results = session?.results;
  const claudeResult = results?.claude;
  const openaiResult = results?.openai;
  
  // Debug logging for results
  console.log('ResultsStep - Session:', session);
  console.log('ResultsStep - Results:', results);
  console.log('ResultsStep - Claude result:', claudeResult);
  console.log('ResultsStep - OpenAI result:', openaiResult);

  // Check if any results need clarification
  const needsClarification = React.useMemo(() => {
    const claudeNeedsClarity = claudeResult?.classification?.type !== 'analysis';
    const openaiNeedsClarity = openaiResult?.classification?.type !== 'analysis';
    const result = claudeNeedsClarity || openaiNeedsClarity;
    
    console.log('ResultsStep - Clarification Check:', {
      claudeType: claudeResult?.classification?.type,
      openaiType: openaiResult?.classification?.type,
      claudeNeedsClarity,
      openaiNeedsClarity,
      needsClarification: result,
      sessionNeedsClarification: session?.needsClarification
    });
    
    return result;
  }, [claudeResult, openaiResult, session?.needsClarification]);

  // Extract questions from AI responses
  const clarificationQuestions = React.useMemo(() => {
    const questions: string[] = [];
    
    if (claudeResult?.classification?.detectedQuestions) {
      questions.push(...claudeResult.classification.detectedQuestions);
    }
    
    if (openaiResult?.classification?.detectedQuestions) {
      questions.push(...openaiResult.classification.detectedQuestions);
    }
    
    // Remove duplicates and clean up
    return [...new Set(questions)].map(q => q.trim()).filter(q => q.length > 0);
  }, [claudeResult, openaiResult]);

  // Extract AI feedback content for display
  const aiFeedback = React.useMemo(() => {
    const feedback: { provider: string; content: string }[] = [];
    
    if (claudeResult?.classification?.type !== 'analysis' && claudeResult?.content) {
      feedback.push({
        provider: 'Claude',
        content: claudeResult.content
      });
    }
    
    if (openaiResult?.classification?.type !== 'analysis' && openaiResult?.content) {
      feedback.push({
        provider: 'OpenAI',
        content: openaiResult.content
      });
    }
    
    console.log('ResultsStep - AI Feedback:', feedback);
    return feedback;
  }, [claudeResult, openaiResult]);

  const handleExport = React.useCallback(async (format: ExportFormat) => {
    if (!session) return;
    
    setIsExporting(true);
    
    try {
      console.log(`Exporting research in ${format} format...`);
      
      const result = await ExportService.exportResearch(session, format);
      
      if (result.success) {
        console.log(`✅ Export successful - ${format.toUpperCase()} file downloaded`);
        
        // Show success feedback (you could add a toast here)
        const message = format === 'pdf' 
          ? 'PDF export opened in new window for printing'
          : `${format.toUpperCase()} file downloaded successfully`;
        
        console.log(message);
        
      } else {
        throw new Error(result.error || 'Export failed');
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      // You could add error toast notification here
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  }, [session]);

  const handleCopyResult = React.useCallback((result: AIResult) => {
    navigator.clipboard.writeText(result.content);
    // In real implementation, would show toast notification
    console.log('Copied to clipboard');
  }, []);

  const handleShare = React.useCallback(() => {
    const shareData = {
      title: 'AI Research Comparison Results',
      text: session?.topic,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
    }
  }, [session?.topic]);

  const handleSubmitClarification = React.useCallback(async () => {
    if (!session || !onSessionUpdate || !clarificationText.trim()) return;
    
    setIsReprocessing(true);
    setShowClarificationModal(false);
    
    try {
      // Enhance the original prompt with clarification
      const enhancedPrompt = `${session.optimizedPrompt || session.topic}

ADDITIONAL CLARIFICATIONS PROVIDED:
${clarificationText}

Please provide a comprehensive research analysis incorporating this additional information.`;

      // Update session with enhanced prompt
      onSessionUpdate({
        optimizedPrompt: enhancedPrompt,
        clarificationStatus: 'provided',
        needsClarification: false,
        updatedAt: new Date()
      });
      
      // Trigger reprocessing
      if (onReprocess) {
        setTimeout(() => {
          onReprocess();
        }, 500);
      }
      
    } catch (error) {
      console.error('Clarification submission error:', error);
    } finally {
      setIsReprocessing(false);
    }
  }, [clarificationText, session, onSessionUpdate, onReprocess]);

  const handleSkipClarification = React.useCallback(() => {
    if (!session || !onSessionUpdate) return;
    
    onSessionUpdate({
      clarificationStatus: 'skipped',
      needsClarification: false,
      updatedAt: new Date()
    });
  }, [session, onSessionUpdate]);

  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const calculateQualityScore = (result: AIResult): number => {
    // Mock quality calculation based on content length and metadata
    const contentScore = Math.min(result.content.length / 2000, 1) * 40;
    const tokenScore = Math.min(result.metadata.tokensUsed / 3000, 1) * 30;
    const timeScore = Math.max(1 - (result.metadata.processingTime / 30000), 0) * 30;
    
    return Math.round(contentScore + tokenScore + timeScore);
  };

  const renderProviderResult = (result: AIResult, provider: AIProvider) => {
    const qualityScore = calculateQualityScore(result);
    const providerInfo = {
      claude: { name: 'Claude', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: '🤖' },
      openai: { name: 'OpenAI', color: 'text-green-600', bgColor: 'bg-green-50', icon: '⚡' }
    }[provider];

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", providerInfo.bgColor)}>
              <span className="text-lg">{providerInfo.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{providerInfo.name}</h3>
              <p className="text-sm text-muted-foreground">
                {result.metadata.model}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Score: {qualityScore}/100
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyResult(result)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metadata */}
        {showMetadata && (
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-900">
                    {result.metadata.tokensUsed.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">Tokens</p>
                </div>
                
                <div className="text-center">
                  <p className="font-medium text-gray-900">
                    ${result.metadata.cost.toFixed(4)}
                  </p>
                  <p className="text-muted-foreground">Cost</p>
                </div>
                
                <div className="text-center">
                  <p className="font-medium text-gray-900">
                    {formatTime(result.metadata.processingTime)}
                  </p>
                  <p className="text-muted-foreground">Time</p>
                </div>
                
                <div className="text-center">
                  <p className="font-medium text-gray-900">
                    {result.content.split(' ').length}
                  </p>
                  <p className="text-muted-foreground">Words</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <Card>
          <CardContent className="pt-4">
            <ScrollArea className="h-[400px] w-full">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {result.content}
                </pre>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderComparison = () => {
    if (!claudeResult || !openaiResult) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Both AI results are needed for comparison
          </p>
        </div>
      );
    }

    const claudeScore = calculateQualityScore(claudeResult);
    const openaiScore = calculateQualityScore(openaiResult);
    const hasAIComparison = session?.comparison;

    return (
      <div className="space-y-6">
        {/* AI-Powered Comparison Analysis (if available) */}
        {hasAIComparison && (
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Scale className="w-5 h-5" />
                🤖 AI-Powered Professional Analysis
              </CardTitle>
              <p className="text-purple-700 text-sm">
                Generated by Claude • {session.comparison.metadata.tokensUsed.toLocaleString()} tokens • ${session.comparison.metadata.cost.toFixed(4)}
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full">
                <div className="prose prose-sm max-w-none prose-purple">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-purple-800 bg-white p-4 rounded border">
                    {session.comparison.content}
                  </pre>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Traditional Comparison Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            {hasAIComparison ? 'Quick Metrics Comparison' : 'AI Comparison Analysis'}
          </h3>
          <p className="text-muted-foreground">
            {hasAIComparison 
              ? 'Basic side-by-side metrics and detailed results below'
              : 'Side-by-side comparison of Claude and OpenAI responses'
            }
          </p>
        </div>

        {/* Score Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span className="font-medium">Claude</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={claudeScore} className="w-24" />
                  <span className="text-sm font-medium">{claudeScore}/100</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="font-medium">OpenAI</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={openaiScore} className="w-24" />
                  <span className="text-sm font-medium">{openaiScore}/100</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Claude Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Content Length:</span>
                <span>{claudeResult.content.split(' ').length} words</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Processing Time:</span>
                <span>{formatTime(claudeResult.metadata.processingTime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cost:</span>
                <span>${claudeResult.metadata.cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tokens Used:</span>
                <span>{claudeResult.metadata.tokensUsed.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">OpenAI Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Content Length:</span>
                <span>{openaiResult.content.split(' ').length} words</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Processing Time:</span>
                <span>{formatTime(openaiResult.metadata.processingTime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cost:</span>
                <span>${openaiResult.metadata.cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tokens Used:</span>
                <span>{openaiResult.metadata.tokensUsed.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side-by-side on Desktop */}
        {!isMobile && (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  🤖 Claude Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {claudeResult.content}
                    </pre>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  ⚡ OpenAI Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {openaiResult.content}
                    </pre>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recommendation */}
        <Alert>
          <Scale className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">
                Recommendation: {claudeScore > openaiScore ? 'Claude' : 'OpenAI'} performed better
              </p>
              <p className="text-sm">
                {claudeScore > openaiScore 
                  ? "Claude provided a more comprehensive and structured response with better detail."
                  : "OpenAI delivered more practical insights with actionable recommendations."
                }
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const renderMobileResults = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="claude" disabled={!claudeResult}>
          🤖 Claude
        </TabsTrigger>
        <TabsTrigger value="openai" disabled={!openaiResult}>
          ⚡ OpenAI  
        </TabsTrigger>
        <TabsTrigger value="compare" disabled={!claudeResult || !openaiResult}>
          <Scale className="w-4 h-4 mr-1" />
          Compare
        </TabsTrigger>
      </TabsList>

      <TabsContent value="claude" className="mt-6">
        {claudeResult && renderProviderResult(claudeResult, 'claude')}
      </TabsContent>

      <TabsContent value="openai" className="mt-6">
        {openaiResult && renderProviderResult(openaiResult, 'openai')}
      </TabsContent>

      <TabsContent value="compare" className="mt-6">
        {renderComparison()}
      </TabsContent>
    </Tabs>
  );

  const renderDesktopResults = () => (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-green-600">✓</div>
            <p className="text-sm font-medium">Completed</p>
            <p className="text-xs text-muted-foreground">Both AI models</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${(session?.totalCost || 0).toFixed(4)}
            </div>
            <p className="text-sm font-medium">Total Cost</p>
            <p className="text-xs text-muted-foreground">USD</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {session?.processingTime ? formatTime(session?.processingTime) : 'N/A'}
            </div>
            <p className="text-sm font-medium">Processing Time</p>
            <p className="text-xs text-muted-foreground">Total elapsed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {((claudeResult?.content.split(' ').length || 0) + 
                (openaiResult?.content.split(' ').length || 0)).toLocaleString()}
            </div>
            <p className="text-sm font-medium">Words Generated</p>
            <p className="text-xs text-muted-foreground">Combined output</p>
          </CardContent>
        </Card>
      </div>

      {/* Results Tabs */}
      <Tabs defaultValue="compare" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="claude" disabled={!claudeResult}>
            🤖 Claude Results
          </TabsTrigger>
          <TabsTrigger value="openai" disabled={!openaiResult}>
            ⚡ OpenAI Results
          </TabsTrigger>
          <TabsTrigger value="compare" disabled={!claudeResult || !openaiResult}>
            <Scale className="w-4 h-4 mr-1" />
            Compare Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="claude" className="mt-6">
          {claudeResult && renderProviderResult(claudeResult, 'claude')}
        </TabsContent>

        <TabsContent value="openai" className="mt-6">
          {openaiResult && renderProviderResult(openaiResult, 'openai')}
        </TabsContent>

        <TabsContent value="compare" className="mt-6">
          {renderComparison()}
        </TabsContent>
      </Tabs>
    </div>
  );

  // Render clarification interface when AI needs more information
  const renderClarificationInterface = () => {
    if (!needsClarification) return null;
    
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
        <div className="max-w-4xl mx-auto">
          {/* Prominent headline */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
              <Lightbulb className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Get More Targeted Results
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your topic has great potential! Adding specific details will unlock deeper, more actionable insights from both AI models.
            </p>
          </div>

          {/* Clear value proposition */}
          <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Why This Matters</h3>
                <p className="text-gray-700 text-sm">
                  Instead of generic overviews, you'll get specific analysis tailored to your exact needs, 
                  industry, and goals - making your research immediately actionable.
                </p>
              </div>
            </div>
          </div>

          {/* Show actual AI feedback prominently */}
          {aiFeedback.length > 0 && (
            <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                What the AI Models Are Saying
              </h3>
              <div className="space-y-4">
                {aiFeedback.map((feedback, index) => (
                  <div key={index} className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-blue-900">
                        {feedback.provider === 'Claude' ? '🤖' : '⚡'} {feedback.provider}:
                      </span>
                    </div>
                    <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-line">
                      {feedback.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Questions in digestible format */}
          {clarificationQuestions.length > 0 && (
            <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Questions Both AI Models Want to Know
              </h3>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-900 font-medium mb-1">Most Important:</p>
                <p className="text-blue-800 text-sm">{clarificationQuestions[0]}</p>
              </div>
              {clarificationQuestions.length > 1 && (
                <details className="mt-3 group">
                  <summary className="cursor-pointer text-sm text-blue-700 hover:text-blue-800 font-medium flex items-center gap-1">
                    <span>+ {clarificationQuestions.length - 1} more questions</span>
                  </summary>
                  <div className="mt-2 space-y-2">
                    {clarificationQuestions.slice(1, 3).map((question, index) => (
                      <div key={index} className="bg-blue-50 p-2 rounded text-sm text-blue-800">
                        {question}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
          
          {/* Input section */}
          <div className="bg-white border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Add Your Specific Requirements
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              The more details you provide, the more valuable and actionable your research will be.
            </p>
            
            <Textarea
              id="clarification-input"
              placeholder="Be specific about:
• Your industry or market segment
• Time period you're interested in
• Geographic focus
• Target audience for your research
• Specific challenges or opportunities
• Budget range or company size

Example: Focus on B2B SaaS companies in North America with 50-500 employees, analyze pricing strategy trends from 2022-2024 for software aimed at marketing teams..."
              value={clarificationText}
              onChange={(e) => setClarificationText(e.target.value)}
              className="min-h-[140px] border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
            />
            
            <div className="flex items-center justify-between mt-3 mb-6">
              <p className="text-xs text-gray-500">
                More specificity = better insights
              </p>
              <span className="text-xs text-gray-400">
                {clarificationText.length} characters
              </span>
            </div>
            
            {/* Prominent CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSubmitClarification}
                disabled={!clarificationText.trim() || isReprocessing}
                className="bg-blue-600 hover:bg-blue-700 text-white text-base py-3 px-6 flex-1"
                size="lg"
              >
                {isReprocessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Generating Enhanced Analysis...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Get My Enhanced Results
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSkipClarification}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 sm:flex-initial"
                disabled={isReprocessing}
              >
                Skip & Use Current Results
              </Button>
            </div>
            
            {/* Process feedback */}
            {isReprocessing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Enhancing Your Research</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Both AI models are re-analyzing with your specific requirements. 
                      This typically takes 15-20 minutes and will deliver much more targeted results.
                    </p>
                    <div className="mt-2 text-xs text-blue-600 bg-blue-100 inline-block px-2 py-1 rounded">
                      Keep this tab open to see your enhanced results
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render content based on results availability
  const renderContent = () => {
    if (!results) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No results available</p>
        </div>
      );
    }

    // If clarification is needed, show simplified interface
    if (needsClarification && clarificationQuestions.length > 0) {
      return (
        <div className="space-y-6">
          {renderClarificationInterface()}
          
          {/* Minimalist preview of what user will get */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <div className="max-w-md mx-auto">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Your Analysis is Ready</h3>
              <p className="text-sm text-gray-600 mb-4">
                Both AI models have completed their analysis. Add clarifications above to unlock more targeted insights, 
                or continue with the current results.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Claude Analysis Ready
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  OpenAI Analysis Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Full results interface when no clarification needed
    return (
      <>        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Results & Comparison</h2>
            <p className="text-muted-foreground">
              Review and compare AI-generated research insights
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetadata(!showMetadata)}
            >
              {showMetadata ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showMetadata ? 'Hide' : 'Show'} Details
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        {/* Export Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="w-5 h-5" />
              Export Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Export PDF
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExport('docx')}
                disabled={isExporting}
              >
                Export Word
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExport('markdown')}
                disabled={isExporting}
              >
                Export Markdown
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              Export includes both AI responses and comparison analysis
            </p>
          </CardContent>
        </Card>

        {/* Results Display */}
        {isMobile ? renderMobileResults() : renderDesktopResults()}

        {/* Final Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Research Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Your AI research comparison has been completed successfully! 
                Both Claude and OpenAI have analyzed your topic and provided comprehensive insights.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {session?.processingTime ? formatTime(session?.processingTime) : 'N/A'}
                </Badge>
                <Badge variant="outline">
                  <DollarSign className="w-3 h-3 mr-1" />
                  ${(session?.totalCost || 0).toFixed(4)}
                </Badge>
                <Badge variant="outline">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  High Quality Results
                </Badge>
              </div>
              
              {onComplete && (
                <div className="pt-3">
                  <Button onClick={() => onComplete(results)} className="w-full sm:w-auto">
                    Save to My Research
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {renderContent()}
    </div>
  );
};

ResultsStep.displayName = "ResultsStep";

export { ResultsStep };