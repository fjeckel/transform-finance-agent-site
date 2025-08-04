import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  DollarSign,
  Globe,
  BookOpen,
  Headphones,
  FolderOpen,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useTranslationStats } from '@/hooks/useTranslationStats';
import { translationService } from '@/services/translationService';
import { toast } from '@/hooks/use-toast';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
];

const CONTENT_TYPES = [
  { value: 'insight', label: 'Insights', icon: BookOpen },
  { value: 'episode', label: 'Episodes', icon: Headphones },
  { value: 'category', label: 'Categories', icon: FolderOpen },
] as const;

const TRANSLATION_FIELDS = {
  insight: ['title', 'subtitle', 'description', 'content', 'summary', 'book_title', 'book_author'],
  episode: ['title', 'description', 'content', 'summary'],
  category: ['name', 'description'],
};

export const TranslationManager: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedContentType, setSelectedContentType] = useState<'insight' | 'episode' | 'category'>('insight');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<{
    current: number;
    total: number;
    currentItem?: string;
  }>({ current: 0, total: 0 });

  const queryClient = useQueryClient();
  const { data: translationStats, isLoading: statsLoading } = useTranslationStats();

  // Get translation queue
  const { data: translationQueue, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ['translation-queue', selectedContentType, selectedLanguage],
    queryFn: () => translationService.getTranslationQueue(selectedContentType, selectedLanguage, 50),
  });

  // Get translation overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['translation-overview'],
    queryFn: () => translationService.getTranslationOverview(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Batch translation mutation
  const batchTranslateMutation = useMutation({
    mutationFn: async ({ contentIds, fields }: { contentIds?: string[], fields: string[] }) => {
      setIsTranslating(true);
      setTranslationProgress({ current: 0, total: contentIds?.length || 10 });

      const result = await translationService.batchTranslate({
        contentType: selectedContentType,
        targetLanguage: selectedLanguage,
        contentIds,
        fields,
        maxItems: 10,
      });

      return result;
    },
    onSuccess: (result) => {
      setIsTranslating(false);
      queryClient.invalidateQueries({ queryKey: ['translation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['translation-overview'] });
      queryClient.invalidateQueries({ queryKey: ['translation-stats'] });
      
      toast({
        title: 'Translation Complete',
        description: `Processed ${result.totalProcessed} items. Cost: $${result.totalCostUsd.toFixed(4)}`,
      });
    },
    onError: (error) => {
      setIsTranslating(false);
      toast({
        title: 'Translation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleBatchTranslate = (contentIds?: string[]) => {
    const fields = TRANSLATION_FIELDS[selectedContentType];
    batchTranslateMutation.mutate({ contentIds, fields });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'completed': return 'secondary';
      case 'in_progress': return 'outline';
      case 'review_needed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 70) return 'text-yellow-500';
    if (percentage >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Translation Management</h1>
        <p className="text-muted-foreground">
          Manage multilingual content translations with AI assistance
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.insights.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {Object.values(overview?.insights.translated || {}).reduce((a, b) => a + b, 0)} translated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Episodes</CardTitle>
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.episodes.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {Object.values(overview?.episodes.translated || {}).reduce((a, b) => a + b, 0)} translated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.categories.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {Object.values(overview?.categories.translated || {}).reduce((a, b) => a + b, 0)} translated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overview?.totalCosts.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">OpenAI API usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Translation Progress */}
      {isTranslating && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Translating content...</span>
                <span>{translationProgress.current}/{translationProgress.total}</span>
              </div>
              <Progress 
                value={(translationProgress.current / translationProgress.total) * 100} 
                className="w-full"
              />
              {translationProgress.currentItem && (
                <p className="text-sm text-muted-foreground">
                  Current: {translationProgress.currentItem}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Translation Queue</TabsTrigger>
          <TabsTrigger value="stats">Language Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Translation Controls</CardTitle>
              <CardDescription>
                Select content type and target language for translation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Content Type</label>
                  <Select value={selectedContentType} onValueChange={(value: any) => setSelectedContentType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon size={16} />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Target Language</label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            {lang.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={() => handleBatchTranslate()}
                    disabled={isTranslating || !translationQueue?.length}
                    className="w-full"
                  >
                    {isTranslating ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Translate All ({translationQueue?.length || 0})
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetchQueue()} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Queue
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Translation Queue */}
          <Card>
            <CardHeader>
              <CardTitle>
                Content Waiting for Translation
                <Badge variant="secondary" className="ml-2">
                  {translationQueue?.length || 0} items
                </Badge>
              </CardTitle>
              <CardDescription>
                {selectedContentType} content that needs translation to {LANGUAGES.find(l => l.code === selectedLanguage)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : translationQueue && translationQueue.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {translationQueue.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.title || item.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {selectedContentType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBatchTranslate([item.id])}
                            disabled={isTranslating}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Translate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No content waiting for translation</p>
                  <p className="text-sm">All {selectedContentType} content is already translated to {LANGUAGES.find(l => l.code === selectedLanguage)?.name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {/* Language Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Translation Completeness by Language</CardTitle>
              <CardDescription>
                Track translation progress across all supported languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : translationStats && translationStats.length > 0 ? (
                <div className="space-y-4">
                  {translationStats.map((stat) => (
                    <div key={stat.language_code} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {LANGUAGES.find(l => l.code === stat.language_code)?.flag || '🏳️'}
                          </span>
                          <span className="font-medium">{stat.language_name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stat.insights_translated}/{stat.insights_total} insights, {' '}
                          {stat.episodes_translated}/{stat.episodes_total} episodes
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">Insights</span>
                            <span className={`text-sm font-medium ${getCompletenessColor(stat.insights_completion_pct)}`}>
                              {stat.insights_completion_pct.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={stat.insights_completion_pct} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">Episodes</span>
                            <span className={`text-sm font-medium ${getCompletenessColor(stat.episodes_completion_pct)}`}>
                              {stat.episodes_completion_pct.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={stat.episodes_completion_pct} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No translation statistics available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};