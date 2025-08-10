import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Link as LinkIcon, 
  Wand2, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Sparkles,
  DollarSign,
  FileUp,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExtractionResult {
  extraction_id: string;
  extracted_fields: {
    title?: string;
    summary?: string;
    description?: string;
    content?: string;
    key_topics?: string[];
    guest_names?: string[];
  };
  confidence_scores: Record<string, number>;
  quality_score: number;
  processing_time: number;
  cost_usd: number;
  validation_errors: string[];
}

interface ExtractionTemplate {
  id: string;
  name: string;
  description: string;
  content_type: string;
  usage_count: number;
  success_rate: number;
}

const ContentExtractor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'url'>('text');
  const [textContent, setTextContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [aiProvider, setAiProvider] = useState<'claude' | 'openai' | 'grok'>('claude');
  const [episodeId, setEpisodeId] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [templates, setTemplates] = useState<ExtractionTemplate[]>([]);
  const [episodes, setEpisodes] = useState<Array<{id: string, title: string}>>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load templates and episodes on component mount
  React.useEffect(() => {
    loadTemplates();
    loadEpisodes();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('extraction_templates')
        .select('id, name, description, content_type, usage_count, success_rate')
        .order('usage_count', { ascending: false });

      if (error) {
        // If table doesn't exist yet, just use empty array (graceful degradation)
        console.warn('Templates table not available yet:', error);
        setTemplates([]);
        return;
      }
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Don't show error toast for missing table - it's expected before migration
      setTemplates([]);
    }
  };

  const loadEpisodes = async () => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('id, title')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEpisodes(data || []);
    } catch (error) {
      console.error('Error loading episodes:', error);
    }
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-detect content type and suggest template
      if (file.name.toLowerCase().includes('transcript')) {
        const transcriptTemplate = templates.find(t => t.content_type === 'transcript');
        if (transcriptTemplate) setSelectedTemplate(transcriptTemplate.id);
      }
    }
  }, [templates]);

  const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const extractContent = async () => {
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStage('Preparing content...');

      let sourceContent = '';
      let sourceType: 'text' | 'file' | 'url' = activeTab;
      let sourceName = '';

      // Get content based on active tab
      if (activeTab === 'text') {
        sourceContent = textContent.trim();
        sourceType = 'text';
        sourceName = 'Pasted Text';
      } else if (activeTab === 'file' && selectedFile) {
        setProcessingStage('Reading file...');
        setProcessingProgress(20);
        sourceContent = await readFileContent(selectedFile);
        sourceType = 'file';
        sourceName = selectedFile.name;
      } else if (activeTab === 'url') {
        setProcessingStage('Fetching URL content...');
        setProcessingProgress(20);
        // TODO: Implement URL fetching
        sourceContent = urlInput;
        sourceType = 'url';
        sourceName = urlInput;
      }

      if (!sourceContent) {
        throw new Error('No content provided');
      }

      setProcessingStage('Analyzing content with AI...');
      setProcessingProgress(40);

      // Call extraction function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/extract-episode-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_type: sourceType,
          source_name: sourceName,
          source_content: sourceContent,
          template_id: selectedTemplate === 'auto-detect' ? undefined : selectedTemplate,
          episode_id: episodeId === 'new-episode' ? undefined : episodeId,
          ai_provider: aiProvider,
          processing_options: {
            parallel_processing: false,
            quality_validation: true,
            auto_approve: false
          }
        })
      });

      setProcessingProgress(80);
      setProcessingStage('Processing results...');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Extraction failed');
      }

      setProcessingProgress(100);
      setProcessingStage('Complete!');
      setExtractionResult(result);

      toast({
        title: "Content Extracted Successfully!",
        description: `Quality Score: ${(result.quality_score * 100).toFixed(1)}% | Cost: $${result.cost_usd.toFixed(4)}`,
      });

    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setProcessingProgress(0);
        setProcessingStage('');
      }, 2000);
    }
  };

  const applyToEpisode = async () => {
    if (!extractionResult || !episodeId || episodeId === 'new-episode') return;

    try {
      const { error } = await supabase
        .from('episodes')
        .update({
          title: extractionResult.extracted_fields.title || null,
          summary: extractionResult.extracted_fields.summary || null,
          description: extractionResult.extracted_fields.description || null,
          content: extractionResult.extracted_fields.content || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', episodeId);

      if (error) throw error;

      // Mark extraction as approved
      await supabase
        .from('content_extractions')
        .update({
          review_status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', extractionResult.extraction_id);

      toast({
        title: "Episode Updated",
        description: "The extracted content has been applied to the episode successfully.",
      });

    } catch (error) {
      console.error('Error applying content:', error);
      toast({
        title: "Error",
        description: "Failed to update episode with extracted content",
        variant: "destructive",
      });
    }
  };

  const getQualityBadgeColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'claude': return '🤖';
      case 'openai': return '⚡';
      case 'grok': return '🚀';
      default: return '🔮';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-cooper">AI Content Extractor</h2>
          <p className="text-gray-600 mt-1">
            Transform any content into structured episode data using AI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            AI-Powered
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Content Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Content Input Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileUp className="w-4 h-4" />
                  File
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-3">
                <Textarea
                  placeholder="Paste your episode content, transcript, or article text here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-[200px] resize-none"
                  maxLength={50000}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Supports up to 50,000 characters</span>
                  <span>{textContent.length}/50,000</span>
                </div>
              </TabsContent>

              <TabsContent value="file" className="space-y-3">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">Drop a file here or click to browse</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports TXT, MD, PDF, DOCX files up to 10MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </TabsContent>

              <TabsContent value="url" className="space-y-3">
                <Input
                  placeholder="https://example.com/article-or-transcript"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    URL fetching will extract content from web pages, blog posts, and articles.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            {/* Configuration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Provider</label>
                <Select value={aiProvider} onValueChange={(value: any) => setAiProvider(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude">
                      <div className="flex items-center gap-2">
                        🤖 Claude (Recommended)
                      </div>
                    </SelectItem>
                    <SelectItem value="openai">
                      <div className="flex items-center gap-2">
                        ⚡ OpenAI GPT-4
                      </div>
                    </SelectItem>
                    <SelectItem value="grok">
                      <div className="flex items-center gap-2">
                        🚀 Grok (Beta)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Template</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-detect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto-detect">Auto-detect (Default Podcast Template)</SelectItem>
                    {templates.length === 0 ? (
                      <SelectItem value="no-templates" disabled>
                        No custom templates available
                      </SelectItem>
                    ) : (
                      templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Episode */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Episode (Optional)</label>
              <Select value={episodeId} onValueChange={setEpisodeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select episode to update" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new-episode">Create new episode</SelectItem>
                  {episodes.map((episode) => (
                    <SelectItem key={episode.id} value={episode.id}>
                      {episode.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Extract Button */}
            <Button
              onClick={extractContent}
              disabled={isProcessing || (
                activeTab === 'text' && !textContent.trim() ||
                activeTab === 'file' && !selectedFile ||
                activeTab === 'url' && !urlInput.trim()
              )}
              className="w-full bg-[#13B87B] hover:bg-[#0F9A6A]"
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Extract Content with AI
                </div>
              )}
            </Button>

            {/* Processing Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{processingStage}</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Extraction Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!extractionResult ? (
              <div className="text-center py-12 text-gray-500">
                <Sparkles className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Run an extraction to see results here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quality Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Quality Score</div>
                    <Badge className={getQualityBadgeColor(extractionResult.quality_score)}>
                      {(extractionResult.quality_score * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Processing Time</div>
                    <div className="font-medium">{(extractionResult.processing_time / 1000).toFixed(1)}s</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Cost</div>
                    <div className="font-medium flex items-center justify-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {extractionResult.cost_usd.toFixed(4)}
                    </div>
                  </div>
                </div>

                {/* Validation Errors */}
                {extractionResult.validation_errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {extractionResult.validation_errors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Extracted Fields */}
                <div className="space-y-3">
                  {Object.entries(extractionResult.extracted_fields).map(([field, value]) => (
                    <div key={field} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium capitalize">
                          {field.replace('_', ' ')}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {(extractionResult.confidence_scores[field] * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      
                      {Array.isArray(value) ? (
                        <div className="flex flex-wrap gap-1">
                          {value.map((item, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 bg-gray-50 rounded text-sm">
                          {typeof value === 'string' && value.length > 200 
                            ? `${value.substring(0, 200)}...` 
                            : value
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4">
                  {!episodeId || episodeId === 'new-episode' ? (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> Select an existing episode above to apply the extracted content directly to it.
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={applyToEpisode}
                      disabled={extractionResult.validation_errors.length > 0}
                      className="flex items-center gap-2 w-full"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Apply to Selected Episode
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => setExtractionResult(null)}
                    className="flex items-center gap-2 w-full"
                  >
                    Clear Results
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentExtractor;