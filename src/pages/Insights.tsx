import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, BookOpen, FileText, Users, Wrench, TrendingUp, Star, Search, X, Filter } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SEOHead from '@/components/SEOHead';
import { useInsights, useInsightCategories, useFeaturedInsights, InsightType, DifficultyLevel } from '@/hooks/useInsights';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { highlightSearchTerms } from '@/utils/searchHighlight';
import { TranslationStatusIndicator } from '@/components/ui/translation-status';

const Insights = () => {
  const { t } = useTranslation(['insights', 'common', 'translation']);
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery: globalSearchQuery } = useGlobalSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<InsightType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [displayCount, setDisplayCount] = useState(9);

  const { data: insights = [], isLoading: insightsLoading } = useInsights();
  const { data: categories = [] } = useInsightCategories();
  const { data: featuredInsights = [] } = useFeaturedInsights(3);

  // Function to generate sample translation status for insights
  const generateTranslationStatus = (insightId: number) => {
    // In production, this would come from an API based on the insight ID
    const statuses = [
      { status: 'approved' as const, quality: 0.95, cost: 0.8 },
      { status: 'completed' as const, quality: 0.9, cost: 0.6 },
      { status: 'pending' as const, quality: 0.0, cost: 0.4 },
      { status: 'translating' as const, quality: 0.0, cost: 0.3 }
    ];
    
    return [
      {
        language: 'de',
        languageName: 'Deutsch',
        flag: '🇩🇪',
        status: 'approved' as const,
        completedFields: 6,
        totalFields: 6,
        quality: 0.95,
        cost: 0.75,
        lastUpdated: new Date().toISOString()
      },
      {
        language: 'en',
        languageName: 'English',
        flag: '🇺🇸',
        status: 'completed' as const,
        completedFields: 6,
        totalFields: 6,
        quality: 1.0,
        cost: 0.0,
        lastUpdated: new Date().toISOString()
      },
      {
        language: 'fr',
        languageName: 'Français',
        flag: '🇫🇷',
        status: statuses[insightId % statuses.length].status,
        completedFields: statuses[insightId % statuses.length].status === 'approved' ? 6 : 
                        statuses[insightId % statuses.length].status === 'completed' ? 6 :
                        statuses[insightId % statuses.length].status === 'pending' ? 2 : 4,
        totalFields: 6,
        quality: statuses[insightId % statuses.length].quality,
        cost: statuses[insightId % statuses.length].cost,
        lastUpdated: new Date().toISOString()
      }
    ];
  };

  // Initialize search from URL parameters or global search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    } else if (globalSearchQuery) {
      setSearchQuery(globalSearchQuery);
    }
  }, [location.search, globalSearchQuery]);

  // Filter insights based on search and filters
  const filteredInsights = useMemo(() => {
    let filtered = insights;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(insight =>
        insight.title.toLowerCase().includes(query) ||
        insight.description?.toLowerCase().includes(query) ||
        insight.summary?.toLowerCase().includes(query) ||
        insight.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        insight.book_title?.toLowerCase().includes(query) ||
        insight.book_author?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(insight => insight.insight_type === selectedType);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(insight => insight.category_id === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(insight => insight.difficulty_level === selectedDifficulty);
    }

    return filtered;
  }, [insights, searchQuery, selectedType, selectedCategory, selectedDifficulty]);

  const getTypeIcon = (type: InsightType) => {
    switch (type) {
      case 'book_summary': return BookOpen;
      case 'blog_article': return FileText;
      case 'guide': return Users;
      case 'case_study': return TrendingUp;
      default: return FileText;
    }
  };

  const getTypeLabel = (type: InsightType) => {
    switch (type) {
      case 'book_summary': return t('insights:types.bookSummary');
      case 'blog_article': return t('insights:types.blogArticle');
      case 'guide': return t('insights:types.guide');
      case 'case_study': return t('insights:types.caseStudy');
      default: return t('insights:types.blogArticle');
    }
  };

  const getDifficultyColor = (level?: DifficultyLevel) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level?: DifficultyLevel) => {
    switch (level) {
      case 'beginner': return t('insights:difficulty.beginner');
      case 'intermediate': return t('insights:difficulty.intermediate');
      case 'advanced': return t('insights:difficulty.advanced');
      default: return t('insights:difficulty.allLevels');
    }
  };

  if (insightsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title={t('insights:title') + ' - Finance Transformers'}
          description={t('insights:subtitle')}
        />
        
        <div className="bg-background border-b border-border sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-[#13B87B] transition-colors">
              <ArrowLeft size={20} className="mr-2" />
              {t('common:buttons.back')} zur Startseite
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="space-y-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48">
                <Skeleton className="h-full w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={t('insights:title') + ' - Finance Transformers'}
        description={t('insights:subtitle')}
      />
      
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-[#13B87B] transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            {t('common:buttons.back')} zur Startseite
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 pb-20 lg:pb-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 font-cooper">
            {t('insights:title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            {t('insights:subtitle')}
          </p>
        </div>

        {/* Featured Insights */}
        {featuredInsights.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 font-cooper flex items-center">
              <Star className="mr-2 text-yellow-500" size={24} />
              {t('insights:recommendedInsights')}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredInsights.map((insight) => {
                const TypeIcon = getTypeIcon(insight.insight_type);
                return (
                  <Card key={insight.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                    <div className="relative">
                      {insight.image_url && (
                        <img 
                          src={insight.image_url} 
                          alt={insight.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => navigate(`/insights/${insight.slug}`)}
                        />
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-yellow-500 text-white">
                          <Star size={12} className="mr-1" />
                          {t('common:status.featured', 'Featured')}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <TypeIcon size={16} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{getTypeLabel(insight.insight_type)}</span>
                        {insight.reading_time_minutes && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <Clock size={12} className="text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{insight.reading_time_minutes} {t('common:time.minutes')}</span>
                          </>
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">
                        {highlightSearchTerms(insight.title, searchQuery)}
                      </h3>
                      {insight.description && (
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          {highlightSearchTerms(insight.description, searchQuery)}
                        </p>
                      )}
                      <Button asChild className="w-full">
                        <Link to={`/insights/${insight.slug}`}>
                          {t('common:buttons.readMore')}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder={t('insights:searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as InsightType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder={t('insights:contentType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('insights:allTypes')}</SelectItem>
                <SelectItem value="book_summary">{t('insights:types.bookSummary')}</SelectItem>
                <SelectItem value="blog_article">{t('insights:types.blogArticle')}</SelectItem>
                <SelectItem value="guide">{t('insights:types.guide')}</SelectItem>
                <SelectItem value="case_study">{t('insights:types.caseStudy')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('common:general.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('insights:allCategories')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as DifficultyLevel | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder={t('common:general.difficulty', 'Schwierigkeit')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('insights:allLevels')}</SelectItem>
                <SelectItem value="beginner">{t('insights:difficulty.beginner')}</SelectItem>
                <SelectItem value="intermediate">{t('insights:difficulty.intermediate')}</SelectItem>
                <SelectItem value="advanced">{t('insights:difficulty.advanced')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {filteredInsights.length} {filteredInsights.length === 1 ? 'Insight' : 'Insights'} {t('common:general.found', 'gefunden')}
            </p>
            {(searchQuery || selectedType !== 'all' || selectedCategory !== 'all' || selectedDifficulty !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                }}
              >
                {t('insights:resetFilters')}
              </Button>
            )}
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredInsights.slice(0, displayCount).map((insight) => {
            const TypeIcon = getTypeIcon(insight.insight_type);
            return (
              <Card key={insight.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div className="relative">
                  {insight.thumbnail_url || insight.image_url ? (
                    <img 
                      src={insight.thumbnail_url || insight.image_url} 
                      alt={insight.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => navigate(`/insights/${insight.slug}`)}
                    />
                  ) : (
                    <div 
                      className="w-full h-48 bg-gradient-to-br from-[#13B87B]/10 to-[#003FA5]/10 flex items-center justify-center cursor-pointer"
                      onClick={() => navigate(`/insights/${insight.slug}`)}
                    >
                      <TypeIcon size={48} className="text-muted-foreground" />
                    </div>
                  )}
                  {insight.book_title && (
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary">
                        <BookOpen size={12} className="mr-1" />
                        {t('insights:bookTitle')}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TypeIcon size={16} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{getTypeLabel(insight.insight_type)}</span>
                    </div>
                    {insight.difficulty_level && (
                      <Badge className={getDifficultyColor(insight.difficulty_level)}>
                        {getDifficultyLabel(insight.difficulty_level)}
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-bold text-lg mb-2 line-clamp-2">
                    {highlightSearchTerms(insight.title, searchQuery)}
                  </h3>
                  
                  {insight.book_author && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('common:general.by', 'von')} {insight.book_author}
                    </p>
                  )}

                  {insight.description && (
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                      {highlightSearchTerms(insight.description, searchQuery)}
                    </p>
                  )}

                  {/* Translation Status Indicator */}
                  <div className="mb-4">
                    <TranslationStatusIndicator
                      contentId={insight.id.toString()}
                      contentType="insight"
                      translations={generateTranslationStatus(insight.id)}
                      compact={true}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {insight.reading_time_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {insight.reading_time_minutes} {t('common:time.minutes')}
                        </div>
                      )}
                      <div>{insight.view_count || 0} {t('common:general.views', 'Aufrufe')}</div>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/insights/${insight.slug}`}>
                        {t('common:buttons.read', 'Lesen')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Load More Button */}
        {displayCount < filteredInsights.length && (
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setDisplayCount(prev => Math.min(prev + 9, filteredInsights.length))}
            >
              {t('common:buttons.loadMore')} Insights ({filteredInsights.length - displayCount} {t('common:general.remaining', 'verbleibend')})
            </Button>
          </div>
        )}

        {/* Empty State */}
        {filteredInsights.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <Search size={48} className="mx-auto text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('insights:noInsights')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('insights:tryOtherTerms')}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
            >
              {t('insights:resetFilters')}
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Mobile Only */}
    </div>
  );
};

export default Insights;