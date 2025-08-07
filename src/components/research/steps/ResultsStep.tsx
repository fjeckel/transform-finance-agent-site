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
  CheckCircle
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
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  ResearchStepProps, 
  ResearchResults, 
  AIResult, 
  AIProvider, 
  ExportOptions, 
  ExportFormat 
} from "@/types/research";

interface ResultsStepProps extends ResearchStepProps {
  onComplete?: (results: ResearchResults) => void;
}

const ResultsStep: React.FC<ResultsStepProps> = ({
  session,
  onComplete,
  className
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = React.useState<string>("claude");
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<ExportFormat>("pdf");
  const [showMetadata, setShowMetadata] = React.useState(false);

  const results = session?.results;
  const claudeResult = results?.claude;
  const openaiResult = results?.openai;

  const handleExport = React.useCallback(async (format: ExportFormat) => {
    if (!results) return;
    
    setIsExporting(true);
    
    try {
      // Mock export functionality
      const exportOptions: ExportOptions = {
        format,
        includeMetadata: true,
        includeComparison: true
      };
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would call an API to generate the export
      console.log('Exporting results:', exportOptions);
      
      // Mock download
      const filename = `ai-research-comparison.${format}`;
      console.log(`Downloaded: ${filename}`);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [results]);

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

    return (
      <div className="space-y-6">
        {/* Comparison Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">AI Comparison Analysis</h3>
          <p className="text-muted-foreground">
            Side-by-side comparison of Claude and OpenAI responses
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
              ${session?.totalCost.toFixed(4)}
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

  // Render content based on results availability
  const renderContent = () => {
    if (!results) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No results available</p>
        </div>
      );
    }

    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between">
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
        <Card>
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
                  ${session?.totalCost.toFixed(4)}
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