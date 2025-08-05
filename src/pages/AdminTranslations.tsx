import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Globe, 
  Languages, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Bot,
  BarChart
} from 'lucide-react';
import { TranslationStatusIndicator } from '@/components/ui/translation-status';
import { AIProviderSelector } from '@/components/ui/ai-provider-selector';
import { TranslationSettings } from '@/components/admin/TranslationSettings';
import { translationService } from '@/services/translationService';
import { toast } from '@/hooks/use-toast';

interface TranslationOverview {
  insights: { total: number; translated: Record<string, number> };
  episodes: { total: number; translated: Record<string, number> };
  categories: { total: number; translated: Record<string, number> };
  totalCosts: number;
}

interface LanguageStats {
  code: string;
  name: string;
  flag: string;
  insightsTranslated: number;
  insightsTotal: number;
  episodesTranslated: number;
  episodesTotal: number;
  completionPercentage: number;
  cost: number;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
];

export default function AdminTranslations() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedContentType, setSelectedContentType] = useState<'all' | 'insight' | 'episode' | 'category'>('all');
  const [batchProvider, setBatchProvider] = useState<'openai' | 'claude'>('openai');
  const [isTranslating, setIsTranslating] = useState(false);

  // Fetch translation overview
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['translation-overview'],
    queryFn: () => translationService.getTranslationOverview(),
  });

  // Calculate language statistics
  const languageStats: LanguageStats[] = languages.map(lang => {
    const insightsTranslated = overview?.insights.translated[lang.code] || 0;
    const episodesTranslated = overview?.episodes.translated[lang.code] || 0;
    const insightsTotal = overview?.insights.total || 0;
    const episodesTotal = overview?.episodes.total || 0;
    const totalTranslated = insightsTranslated + episodesTranslated;
    const totalContent = insightsTotal + episodesTotal;
    const completionPercentage = totalContent > 0 ? Math.round((totalTranslated / totalContent) * 100) : 0;

    return {
      code: lang.code,
      name: lang.name,
      flag: lang.flag,
      insightsTranslated,
      insightsTotal,
      episodesTranslated,
      episodesTotal,
      completionPercentage,
      cost: 0, // This would be calculated from actual cost data
    };
  });

  const handleBatchTranslate = async () => {
    if (!selectedContentType || selectedContentType === 'all') {
      toast({
        title: 'Selection Required',
        description: 'Please select a specific content type for batch translation',
        variant: 'destructive'
      });
      return;
    }

    if (selectedLanguage === 'all') {
      toast({
        title: 'Selection Required', 
        description: 'Please select a specific target language',
        variant: 'destructive'
      });
      return;
    }

    setIsTranslating(true);

    try {
      const result = await translationService.batchTranslate({
        contentType: selectedContentType as 'insight' | 'episode' | 'category',
        targetLanguage: selectedLanguage,
        fields: ['title', 'description', 'content', 'summary'],
        aiProvider: batchProvider,
        maxItems: 10 // Limit batch size for safety
      });

      if (result.success) {
        toast({
          title: 'Batch Translation Complete',
          description: `Successfully translated ${result.totalProcessed} items to ${selectedLanguage}. Cost: $${result.totalCostUsd.toFixed(2)}`,
        });
        refetchOverview();
      } else {
        toast({
          title: 'Batch Translation Failed',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Translation Error',
        description: error instanceof Error ? error.message : 'Failed to start batch translation',
        variant: 'destructive'
      });
    } finally {
      setIsTranslating(false);
    }
  };

  if (overviewLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Translation Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Translation Management</h1>
          <p className="text-muted-foreground">Manage AI-powered content translations</p>
        </div>
        <Button onClick={() => refetchOverview()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(overview?.insights.total || 0) + (overview?.episodes.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview?.insights.total || 0} insights, {overview?.episodes.total || 0} episodes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{languages.length}</div>
            <p className="text-xs text-muted-foreground">Supported languages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Translations</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(overview?.insights.translated || {}).reduce((sum, count) => sum + count, 0) +
               Object.values(overview?.episodes.translated || {}).reduce((sum, count) => sum + count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all languages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Translation Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overview?.totalCosts.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Total spent on AI translations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="batch">Batch Translate</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Language Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Translation Progress by Language</CardTitle>
              <CardDescription>
                Current translation status across all supported languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {languageStats.map((lang) => (
                  <div key={lang.code} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <div className="font-medium">{lang.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {lang.insightsTranslated + lang.episodesTranslated} of{' '}
                            {lang.insightsTotal + lang.episodesTotal} items translated
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{lang.completionPercentage}%</div>
                        <div className="text-sm text-muted-foreground">complete</div>
                      </div>
                    </div>
                    <Progress value={lang.completionPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{lang.insightsTranslated} insights</span>
                      <span>{lang.episodesTranslated} episodes</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batch Translation Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Batch Translation
                </CardTitle>
                <CardDescription>
                  Translate multiple pieces of content at once using AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Language</label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <span className="flex items-center gap-2">
                            {lang.flag} {lang.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Content Type</label>
                  <Select value={selectedContentType} onValueChange={(value: any) => setSelectedContentType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="insight">Insights</SelectItem>
                      <SelectItem value="episode">Episodes</SelectItem>
                      <SelectItem value="category">Categories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">AI Provider</label>
                  <Select value={batchProvider} onValueChange={(value: any) => setBatchProvider(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI GPT-4o Mini</SelectItem>
                      <SelectItem value="claude">Claude 3.5 Haiku</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleBatchTranslate} 
                  disabled={isTranslating || selectedLanguage === 'all' || selectedContentType === 'all'}
                  className="w-full"
                >
                  {isTranslating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4 mr-2" />
                      Start Batch Translation
                    </>
                  )}
                </Button>

                {selectedLanguage !== 'all' && selectedContentType !== 'all' && (
                  <div className="text-sm text-muted-foreground">
                    This will translate up to 10 {selectedContentType}s to {
                      languages.find(l => l.code === selectedLanguage)?.name
                    } using {batchProvider === 'openai' ? 'OpenAI' : 'Claude'}.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Translation Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Translation Queue
                </CardTitle>
                <CardDescription>
                  Content waiting to be translated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {languages.map((lang) => {
                    const pendingInsights = (overview?.insights.total || 0) - (overview?.insights.translated[lang.code] || 0);
                    const pendingEpisodes = (overview?.episodes.total || 0) - (overview?.episodes.translated[lang.code] || 0);
                    const totalPending = pendingInsights + pendingEpisodes;

                    return (
                      <div key={lang.code} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{lang.flag}</span>
                          <span className="font-medium">{lang.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{totalPending}</div>
                          <div className="text-xs text-muted-foreground">pending</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <TranslationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}