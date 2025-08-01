import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  FileText, 
  Headphones, 
  Clock, 
  TrendingUp, 
  Star,
  ChevronRight,
  Sparkles,
  Target,
  Activity
} from 'lucide-react';
import { useRecommendations, RecommendationScore, ContentItem } from '@/utils/recommendationEngine';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface RecommendedContentProps {
  currentContentId?: string;
  userId?: string;
  maxItems?: number;
  showTabs?: boolean;
  variant?: 'compact' | 'detailed';
}

export const RecommendedContent: React.FC<RecommendedContentProps> = ({
  currentContentId,
  userId,
  maxItems = 6,
  showTabs = true,
  variant = 'detailed'
}) => {
  const [contentBasedRecs, setContentBasedRecs] = useState<RecommendationScore[]>([]);
  const [personalizedRecs, setPersonalizedRecs] = useState<RecommendationScore[]>([]);
  const [trendingRecs, setTrendingRecs] = useState<RecommendationScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personalized' | 'similar' | 'trending'>('personalized');
  
  const recommendations = useRecommendations();

  useEffect(() => {
    loadRecommendations();
  }, [currentContentId, userId]);

  const loadRecommendations = async () => {
    setLoading(true);
    
    try {
      const promises: Promise<any>[] = [];

      // Content-based recommendations (if we have a current content)
      if (currentContentId) {
        promises.push(
          recommendations.getContentBased(currentContentId, maxItems)
            .then(recs => enrichRecommendations(recs))
            .then(setContentBasedRecs)
        );
      }

      // Personalized recommendations (if we have a user)
      if (userId) {
        promises.push(
          recommendations.getPersonalized(userId, maxItems, currentContentId ? [currentContentId] : [])
            .then(recs => enrichRecommendations(recs))
            .then(setPersonalizedRecs)
        );
      }

      // Trending content
      promises.push(
        recommendations.getTrending('week', maxItems)
          .then(recs => enrichRecommendations(recs))
          .then(setTrendingRecs)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enrich recommendations with full content data
  const enrichRecommendations = async (recs: RecommendationScore[]): Promise<RecommendationScore[]> => {
    if (recs.length === 0) return [];

    const contentIds = recs.map(rec => rec.content.id);
    
    // Fetch full content data from different tables
    const [episodes, insights, pdfs] = await Promise.all([
      supabase
        .from('episodes')
        .select('id, title, slug, description, summary, series, duration, image_url')
        .in('id', contentIds)
        .eq('status', 'published'),
      supabase
        .from('insights')
        .select('id, title, slug, description, summary, insight_type, difficulty_level, reading_time, image_url, category')
        .in('id', contentIds)
        .eq('status', 'published'),
      supabase
        .from('pdfs')
        .select('id, title, slug, description')
        .in('id', contentIds)
    ]);

    const allContent: ContentItem[] = [
      ...(episodes.data?.map(ep => ({ ...ep, type: 'episode' as const })) || []),
      ...(insights.data?.map(ins => ({ ...ins, type: 'insight' as const })) || []),
      ...(pdfs.data?.map(pdf => ({ ...pdf, type: 'pdf' as const })) || []),
    ];

    // Match content data with recommendations
    return recs
      .map(rec => {
        const fullContent = allContent.find(content => content.id === rec.content.id);
        return fullContent ? { ...rec, content: fullContent } : null;
      })
      .filter(Boolean) as RecommendationScore[];
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'episode': return Headphones;
      case 'insight': return BookOpen;
      case 'pdf': return FileText;
      default: return FileText;
    }
  };

  const getContentPath = (content: ContentItem) => {
    switch (content.type) {
      case 'episode': return `/episode/${content.slug}`;
      case 'insight': return `/insights/${content.slug}`;
      case 'pdf': return `/report/${content.id}`;
      default: return '#';
    }
  };

  const getTypeLabel = (type: string, insight_type?: string) => {
    if (type === 'episode') return 'Episode';
    if (type === 'insight') {
      switch (insight_type) {
        case 'book_summary': return 'Buchzusammenfassung';
        case 'blog_article': return 'Artikel';
        case 'guide': return 'Leitfaden';
        case 'case_study': return 'Fallstudie';
        default: return 'Insight';
      }
    }
    if (type === 'pdf') return 'Report';
    return type;
  };

  const RecommendationCard: React.FC<{ rec: RecommendationScore; index: number }> = ({ rec, index }) => {
    const ContentIcon = getContentIcon(rec.content.type);
    
    return (
      <Card className="group hover:shadow-md transition-all duration-200 hover:border-[#13B87B]/20">
        <CardContent className="p-4">
          <Link to={getContentPath(rec.content)} className="block">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-8 h-8 bg-[#13B87B]/10 rounded-full flex items-center justify-center group-hover:bg-[#13B87B]/20 transition-colors">
                <ContentIcon size={16} className="text-[#13B87B]" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm leading-snug group-hover:text-[#13B87B] transition-colors line-clamp-2">
                  {rec.content.title}
                </h4>
                
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    {getTypeLabel(rec.content.type, rec.content.insight_type)}
                  </Badge>
                  
                  {rec.content.reading_time && (
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      <span>{rec.content.reading_time} Min</span>
                    </div>
                  )}
                  
                  {rec.content.duration && (
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      <span>{rec.content.duration}</span>
                    </div>
                  )}
                </div>
                
                {variant === 'detailed' && rec.reasons.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Sparkles size={10} />
                      <span className="truncate">{rec.reasons[0]}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Score indicator */}
              {variant === 'detailed' && (
                <div className="flex-shrink-0 text-xs text-muted-foreground">
                  {Math.round(rec.score * 100)}%
                </div>
              )}
            </div>
          </Link>
        </CardContent>
      </Card>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(variant === 'compact' ? 3 : 4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {showTabs && (
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        )}
        <LoadingSkeleton />
      </div>
    );
  }

  const tabsData = [
    {
      id: 'personalized' as const,
      label: 'Für Sie',
      icon: Target,
      data: personalizedRecs,
      description: 'Basierend auf Ihren Interessen'
    },
    {
      id: 'similar' as const,
      label: 'Ähnliche Inhalte',
      icon: Star,
      data: contentBasedRecs,
      description: 'Ähnlich zu diesem Inhalt'
    },
    {
      id: 'trending' as const,
      label: 'Trending',
      icon: Activity,
      data: trendingRecs,
      description: 'Derzeit beliebt'
    }
  ].filter(tab => tab.data.length > 0);

  if (tabsData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <BookOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>Keine Empfehlungen verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  // Single section without tabs
  if (!showTabs || tabsData.length === 1) {
    const data = tabsData[0]?.data || [];
    const displayData = variant === 'compact' ? data.slice(0, 3) : data;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles size={18} className="text-[#13B87B]" />
            Empfohlene Inhalte
          </h3>
          {data.length > displayData.length && (
            <Button variant="ghost" size="sm" className="text-[#13B87B]">
              Alle anzeigen <ChevronRight size={14} className="ml-1" />
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          {displayData.map((rec, index) => (
            <RecommendationCard key={rec.content.id} rec={rec} index={index} />
          ))}
        </div>
      </div>
    );
  }

  // Tabbed interface
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Sparkles size={18} className="text-[#13B87B]" />
        Empfohlene Inhalte
      </h3>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          {tabsData.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5">
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {tabsData.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-3">
            <p className="text-sm text-muted-foreground">{tab.description}</p>
            <div className="space-y-3">
              {tab.data.slice(0, variant === 'compact' ? 3 : maxItems).map((rec, index) => (
                <RecommendationCard key={rec.content.id} rec={rec} index={index} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default RecommendedContent;