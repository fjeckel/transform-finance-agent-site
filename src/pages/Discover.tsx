import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlayCircle, Search, Mic2, Rocket, Headphones, ArrowRight, 
  Mail, Star, Calendar, Filter, ChevronRight, Users2, 
  BookOpen, TrendingUp, Target, Lightbulb, Globe, Clock, User, X
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SEOHead from '@/components/SEOHead';
import { useEpisodes } from '@/hooks/useEpisodes';
import { useInsights } from '@/hooks/useInsights';
import { usePdfs } from '@/hooks/usePdfs';
import { useYouTubeVideos, type YouTubeVideo } from '@/hooks/useYouTubeVideos';
import { SafeHtmlRenderer } from '@/lib/content-security';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { SimplePDFCard } from '@/components/purchase/SimplePurchaseButton';

// Content categories/tags
const CONTENT_TAGS = [
  'CFO Leadership',
  'FP&A Strategy', 
  'Digital Transformation',
  'AI & Automation',
  'Scale-up Finance',
  'Controlling',
  'Treasury',
  'Process Optimization'
];

const STORY_FLOW_SECTIONS = [
  {
    icon: <Target className="h-6 w-6" />,
    title: 'Identify Challenges',
    description: 'Real finance leaders sharing their biggest transformation hurdles and breakthrough moments.'
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: 'Learn Solutions',
    description: 'Practical playbooks, frameworks, and tools that actually work in complex finance environments.'
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'Drive Results',
    description: 'Implement proven strategies and measure success with metrics that matter to your business.'
  }
];

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'episodes' | 'insights' | 'memos'>('all');
  const [sortOption, setSortOption] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'title_desc'>('date_desc');
  const [displayCount, setDisplayCount] = useState<number>(9);
  
  const { episodes, loading: episodesLoading } = useEpisodes();
  const { data: insightsData, isLoading: insightsLoading } = useInsights();
  const { pdfs, loading: pdfsLoading } = usePdfs();
  const { searchQuery: globalSearchQuery } = useGlobalSearch();
  const location = useLocation();
  const navigate = useNavigate();

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

  // Reset display count when search query or filters change
  useEffect(() => {
    setDisplayCount(9);
  }, [searchQuery, selectedSeries, activeTab]);

  // Helper functions for series handling (copied from Episodes page)
  const getSeriesBadgeColor = (series: string) => {
    switch (series) {
      case 'wtf': return 'bg-purple-500 text-white';
      case 'finance_transformers': return 'bg-[#003FA5] text-white';
      case 'cfo_memo': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeriesDisplayName = (series: string) => {
    switch (series) {
      case 'wtf': return 'WTF';
      case 'finance_transformers': return 'Finance Transformers';
      case 'cfo_memo': return 'CFO Memo';
      default: return series;
    }
  };

  // Series options for filtering (adapted from Episodes page)
  const seriesOptions = useMemo(() => {
    const searchFiltered = searchQuery.trim() 
      ? episodes.filter(episode => {
          const query = searchQuery.toLowerCase();
          try {
            return episode.title?.toLowerCase().includes(query) ||
              (episode.description && episode.description.toLowerCase().includes(query)) ||
              (episode.summary && episode.summary.toLowerCase().includes(query)) ||
              (episode.content && episode.content.toLowerCase().includes(query)) ||
              (episode.guests && Array.isArray(episode.guests) && episode.guests.some(guest => 
                guest && guest.name && guest.name.toLowerCase().includes(query)
              )) ||
              (episode.series && getSeriesDisplayName(episode.series).toLowerCase().includes(query));
          } catch (error) {
            console.error('Search error for episode:', episode.id, error);
            return false;
          }
        })
      : episodes;
    
    return [
      { value: 'all', label: 'Alle Serien', count: searchFiltered.length },
      { value: 'wtf', label: 'WTF', count: searchFiltered.filter(e => e.series === 'wtf').length },
      { value: 'finance_transformers', label: 'Finance Transformers', count: searchFiltered.filter(e => e.series === 'finance_transformers').length },
      { value: 'cfo_memo', label: 'CFO Memo', count: searchFiltered.filter(e => e.series === 'cfo_memo').length }
    ];
  }, [episodes, searchQuery]);

  // Filter episodes by series and search
  const filteredEpisodes = useMemo(() => {
    let filtered = episodes;
    
    if (selectedSeries !== 'all') {
      filtered = filtered.filter(episode => episode.series === selectedSeries);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(episode => {
        try {
          if (episode.title?.toLowerCase().includes(query)) return true;
          if (episode.description && episode.description.toLowerCase().includes(query)) return true;
          if (episode.guests && Array.isArray(episode.guests) && episode.guests.some(guest => 
            guest && guest.name && guest.name.toLowerCase().includes(query)
          )) return true;
          if (episode.series && getSeriesDisplayName(episode.series).toLowerCase().includes(query)) return true;
          return false;
        } catch (error) {
          console.error('Filter error for episode:', episode.id, error);
          return false;
        }
      });
    }
    
    return filtered;
  }, [episodes, selectedSeries, searchQuery]);

  // Filter insights by search
  const filteredInsights = useMemo(() => {
    if (!searchQuery.trim()) return insightsData || [];
    
    const query = searchQuery.toLowerCase();
    return (insightsData || []).filter(insight => {
      try {
        return insight.title?.toLowerCase().includes(query) ||
          (insight.content && insight.content.toLowerCase().includes(query)) ||
          (insight.excerpt && insight.excerpt.toLowerCase().includes(query));
      } catch (error) {
        console.error('Filter error for insight:', insight.id, error);
        return false;
      }
    });
  }, [insightsData, searchQuery]);

  // Filter PDFs by search
  const filteredPdfs = useMemo(() => {
    if (!searchQuery.trim()) return pdfs || [];
    
    const query = searchQuery.toLowerCase();
    return (pdfs || []).filter(pdf => {
      try {
        return pdf.title?.toLowerCase().includes(query) ||
          (pdf.description && pdf.description.toLowerCase().includes(query));
      } catch (error) {
        console.error('Filter error for PDF:', pdf.id, error);
        return false;
      }
    });
  }, [pdfs, searchQuery]);

  // Sort episodes (adapted from Episodes page)
  const sortedEpisodes = useMemo(() => {
    const sorted = [...filteredEpisodes];
    sorted.sort((a, b) => {
      switch (sortOption) {
        case 'date_asc':
          return new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime();
        case 'date_desc':
          return new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredEpisodes, sortOption]);

  const featuredContent = episodes[0];
  const loading = episodesLoading || insightsLoading || pdfsLoading;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-600">
              <Badge className="mb-4 bg-[#13B87B]/10 text-[#13B87B] hover:bg-[#13B87B]/20">
                Entdecke Finance Transformation
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight font-cooper">
                Inhalte, die Finance 
                <span className="text-[#13B87B] block">transformieren</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
                Tiefe Einblicke, praktische Playbooks und ehrliche Gespräche mit Finance-Führungskräften, 
                die echte Transformation vorantreiben.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-[#13B87B] hover:bg-[#0FA66A] text-white font-cooper font-bold"
                  onClick={() => document.getElementById('content-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  Jetzt entdecken
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="font-cooper"
                  onClick={() => featuredContent?.slug && navigate(`/episode/${featuredContent.slug}`)}
                  disabled={!featuredContent?.slug}
                >
                  <Headphones className="mr-2 h-5 w-5" />
                  Neueste Folge hören
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-[#13B87B]" />
                  <span>Über 1.000 aktive Hörer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Neue Inhalte jede Woche</span>
                </div>
              </div>
            </div>

            {/* Featured Content Card */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              {featuredContent && (
                <Card className="overflow-hidden border-2 border-[#13B87B]/20 hover:border-[#13B87B]/40 transition-colors">
                  <CardHeader className="p-0">
                    <img 
                      src={featuredContent.image_url || '/img/wtf-cover.png'} 
                      alt={featuredContent.title}
                      className="h-48 w-full object-cover"
                    />
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Neueste Folge</Badge>
                        {featuredContent.series && (
                          <Badge className={`text-xs ${getSeriesBadgeColor(featuredContent.series)}`}>
                            {getSeriesDisplayName(featuredContent.series)}
                          </Badge>
                        )}
                      </div>
                      {featuredContent.duration && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {featuredContent.duration}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 font-cooper leading-tight">
                      {featuredContent.title}
                    </h3>
                    
                    {featuredContent.guests && featuredContent.guests.length > 0 && (
                      <p className="text-muted-foreground mb-3">
                        Gäste: {featuredContent.guests
                          .filter(g => g && g.name)
                          .map(g => g.name)
                          .join(', ')}
                      </p>
                    )}
                    
                    <div className="text-sm text-muted-foreground mb-4">
                      <SafeHtmlRenderer 
                        content={featuredContent.description || ''} 
                        className="line-clamp-3"
                      />
                    </div>
                    
                    <Button 
                      className="w-full bg-[#13B87B] hover:bg-[#0FA66A] font-cooper"
                      onClick={() => navigate(`/episode/${featuredContent.slug}`)}
                    >
                      Jetzt anhören
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Story Flow Section */}
      <section className="bg-muted/40 border-y">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 font-cooper">
              Deine Finance Transformation Journey
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Folge unserem bewährten Ansatz für erfolgreiche Finance-Transformation
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {STORY_FLOW_SECTIONS.map((section, index) => (
              <div
                key={section.title}
                className={`animate-in fade-in slide-in-from-bottom-4 duration-600 ${index === 1 ? 'delay-150' : index === 2 ? 'delay-300' : ''}`}
              >
                <Card className="text-center h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto mb-4 w-12 h-12 bg-[#13B87B]/10 rounded-xl flex items-center justify-center text-[#13B87B]">
                      {section.icon}
                    </div>
                    <CardTitle className="font-cooper">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{section.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YouTube Shorts Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-6">
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold font-cooper mb-2">WTF?! Finance Shorts</h2>
                <p className="text-muted-foreground">
                  Kurze, knackige Finance-Insights in unter 60 Sekunden
                </p>
              </div>
              <a 
                href="https://www.youtube.com/@WTFFinanceTransformers" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-[#13B87B] hover:text-[#0FA66A] font-medium flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                YouTube Channel
              </a>
            </div>
            <YouTubeVideosSection />
          </Card>
        </div>
      </section>

      {/* Content Browser Section */}
      <section id="content-section" className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4 font-cooper">Durchsuche alle Inhalte</h2>
            <p className="text-muted-foreground mb-8">
              Entdecke alle Episoden, Insights und CFO Memos an einem Ort
            </p>

            {/* Tabs - same structure as Episodes page */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-12 mb-8">
                <TabsTrigger value="all" className="text-sm font-medium data-[state=active]:bg-[#13B87B] data-[state=active]:text-white">
                  Alle Inhalte
                </TabsTrigger>
                <TabsTrigger value="episodes" className="text-sm font-medium data-[state=active]:bg-[#13B87B] data-[state=active]:text-white">
                  Episoden ({episodes.length})
                </TabsTrigger>
                <TabsTrigger value="insights" className="text-sm font-medium data-[state=active]:bg-[#13B87B] data-[state=active]:text-white">
                  Insights ({(insightsData || []).length})
                </TabsTrigger>
                <TabsTrigger value="memos" className="text-sm font-medium data-[state=active]:bg-[#13B87B] data-[state=active]:text-white">
                  CFO Memos ({(pdfs || []).length})
                </TabsTrigger>
              </TabsList>

              {/* Episodes Tab - Now as Carousel */}
              <TabsContent value="episodes" className="mt-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold font-cooper">Alle Episoden</h3>
                    <Link to="/episodes" className="text-sm text-[#13B87B] hover:text-[#0FA66A] font-medium">
                      Alle ansehen →
                    </Link>
                  </div>
                  
                  {/* Episodes Carousel */}
                  {loading ? (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-80">
                          <Card className="overflow-hidden">
                            <div className="aspect-square bg-muted animate-pulse" />
                            <CardContent className="p-4 space-y-3">
                              <div className="h-4 bg-muted animate-pulse rounded" />
                              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  ) : sortedEpisodes.length === 0 ? (
                    <div className="text-center py-8 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground">Keine Episoden verfügbar</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                        {sortedEpisodes.slice(0, 10).map((episode) => (
                          <div key={episode.id} className="flex-shrink-0 w-80 snap-start">
                            <EpisodeCard episode={episode} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="mt-8">
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      type="text"
                      placeholder="Suche nach Insight-Titel oder Inhalt..."
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

                {loading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <CardContent className="p-4 space-y-3">
                          <div className="h-4 bg-muted animate-pulse rounded" />
                          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                          <div className="h-20 bg-muted animate-pulse rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredInsights.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Keine Insights gefunden</h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery ? `Keine Insights für "${searchQuery}" gefunden.` : 'Keine Insights verfügbar.'}
                    </p>
                    {searchQuery && (
                      <Button variant="outline" onClick={() => setSearchQuery('')}>
                        Suche zurücksetzen
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInsights.slice(0, displayCount).map((insight) => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Memos Tab */}
              <TabsContent value="memos" className="mt-8">
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      type="text"
                      placeholder="Suche nach Memo-Titel oder Beschreibung..."
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

                {loading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <CardContent className="p-4 space-y-3">
                          <div className="h-4 bg-muted animate-pulse rounded" />
                          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                          <div className="h-20 bg-muted animate-pulse rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredPdfs.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Keine Memos gefunden</h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery ? `Keine Memos für "${searchQuery}" gefunden.` : 'Keine Memos verfügbar.'}
                    </p>
                    {searchQuery && (
                      <Button variant="outline" onClick={() => setSearchQuery('')}>
                        Suche zurücksetzen
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPdfs.slice(0, displayCount).map((pdf) => (
                      <SimplePDFCard key={pdf.id} pdf={pdf} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* All Content Tab */}
              <TabsContent value="all" className="mt-8">
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      type="text"
                      placeholder="Suche in allen Inhalten..."
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

                {/* Mixed content grid combining all types */}
                <div className="space-y-8">
                  {/* Episodes Section */}
                  {sortedEpisodes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-4 font-cooper">Episoden</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedEpisodes.slice(0, 3).map((episode) => (
                          <EpisodeCard key={episode.id} episode={episode} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insights Section */}
                  {filteredInsights.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-4 font-cooper">Insights</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInsights.slice(0, 3).map((insight) => (
                          <InsightCard key={insight.id} insight={insight} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PDFs Section */}
                  {filteredPdfs.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-4 font-cooper">CFO Memos</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPdfs.slice(0, 3).map((pdf) => (
                          <SimplePDFCard key={pdf.id} pdf={pdf} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Newsletter CTA Section with Beehiiv */}
      <section className="bg-gradient-to-r from-[#13B87B] to-[#0FA66A] text-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-cooper">
              Verpasse keine Finance Transformation
            </h2>
            <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
              Erhalte neue Folgen, exklusive Insights und praktische Playbooks direkt in dein Postfach.
            </p>
          </div>

          {/* Beehiiv Embed Container */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-4xl mx-auto">
            <div 
              dangerouslySetInnerHTML={{
                __html: `
                  <script async src="https://subscribe-forms.beehiiv.com/embed.js"></script>
                  <iframe 
                    src="https://subscribe-forms.beehiiv.com/a9e32608-ec31-4e7b-8bd1-e4d4cd9f1ae2" 
                    class="beehiiv-embed" 
                    data-test-id="beehiiv-embed" 
                    frameborder="0" 
                    scrolling="no" 
                    style="width: 100%; height: 415px; margin: 0; border-radius: 8px; background-color: transparent; box-shadow: none; max-width: 100%;"
                    title="Newsletter Anmeldung"
                  ></iframe>
                `
              }}
            />
          </div>

          <p className="text-sm text-green-100 mt-6 text-center">
            Kostenlos. Jederzeit kündbar. Kein Spam. Über 1.000 Finance-Profis sind bereits dabei.
          </p>
        </div>
      </section>
    </div>
  );
}

// Episode Card Component (adapted from Episodes page)
function EpisodeCard({ episode }: { episode: any }) {
  const navigate = useNavigate();
  
  const getSeriesBadgeColor = (series: string) => {
    switch (series) {
      case 'wtf': return 'bg-purple-500 text-white';
      case 'finance_transformers': return 'bg-[#003FA5] text-white';
      case 'cfo_memo': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeriesDisplayName = (series: string) => {
    switch (series) {
      case 'wtf': return 'WTF';
      case 'finance_transformers': return 'Finance Transformers';
      case 'cfo_memo': return 'CFO Memo';
      default: return series;
    }
  };
  
  return (
    <Link to={`/episode/${episode.slug}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
        <div className="aspect-square overflow-hidden">
          <img
            src={episode.image_url || '/img/wtf-cover.png'}
            alt={episode.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      
        <CardHeader className="pb-3">
          <div className="mb-2 flex items-center space-x-2">
            <span className="inline-block bg-gray-700 text-white px-2 py-1 rounded-full text-xs font-bold">
              S{episode.season}E{episode.episode_number}
            </span>
            {episode.series && (
              <Badge className={`text-xs ${getSeriesBadgeColor(episode.series)}`}>
                {getSeriesDisplayName(episode.series)}
              </Badge>
            )}
          </div>
          
          <CardTitle className="text-lg leading-tight mb-2">
            {episode.title}
          </CardTitle>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            {episode.duration && (
              <div className="flex items-center">
                <Clock size={14} className="mr-1" />
                <span>{episode.duration}</span>
              </div>
            )}
            {episode.publish_date && (
              <div className="flex items-center">
                <Calendar size={14} className="mr-1" />
                <span>{new Date(episode.publish_date).toLocaleDateString('de-DE')}</span>
              </div>
            )}
          </div>

          {episode.guests && episode.guests.length > 0 && (
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <User size={14} className="mr-1" />
              <span>{episode.guests
                .filter((g: any) => g && g.name)
                .map((g: any) => g.name)
                .join(', ')}</span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="text-gray-700 text-sm mb-4 line-clamp-3">
            <SafeHtmlRenderer 
              content={episode.description || ''}
              className="text-gray-700 text-sm"
            />
          </div>
          
          <Button className="w-full bg-[#13B87B] hover:bg-[#0F9A6A] text-white">
            <PlayCircle size={16} className="mr-2" />
            Zur Episode
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

// Insight Card Component
function InsightCard({ insight }: { insight: any }) {
  const navigate = useNavigate();
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
          onClick={() => navigate(`/insights/${insight.slug}`)}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary">Insight</Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(insight.created_at).toLocaleDateString('de-DE')}
          </span>
        </div>
        
        <CardTitle className="text-lg leading-tight mb-2">
          {insight.title}
        </CardTitle>
        
        {insight.author_name && (
          <p className="text-sm text-muted-foreground mb-3">
            von {insight.author_name}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4 line-clamp-4">
          <SafeHtmlRenderer 
            content={insight.excerpt || insight.content?.substring(0, 200) + '...' || ''}
            className="text-sm"
          />
        </div>
        
        <Button size="sm" className="w-full bg-[#13B87B] hover:bg-[#0FA66A] text-white">
          <BookOpen className="mr-2 h-4 w-4" />
          Artikel lesen
        </Button>
      </CardContent>
    </Card>
  );
}

// YouTube Videos Section Component with Lazy Loading
function YouTubeVideosSection() {
  const { videos, loading, error, refreshVideos } = useYouTubeVideos(true, 6); // Only shorts, limit to 6
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  // Debug logging
  console.log('YouTubeVideosSection render:', {
    videosCount: videos.length,
    loading,
    error,
    firstVideo: videos[0] || null,
    videosSample: videos.slice(0, 2).map(v => ({ 
      id: v.id, 
      title: v.title, 
      thumbnail: v.thumbnail, 
      videoId: v.videoId,
      isShort: v.isShort
    }))
  });

  if (loading) {
    return (
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-60 flex-shrink-0">
              <Card className="overflow-hidden">
                <div className="aspect-[9/16] bg-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-muted-foreground mb-4">
          YouTube Videos konnten nicht geladen werden
        </div>
        <Button 
          onClick={refreshVideos}
          variant="outline" 
          size="sm"
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Horizontal Scrollable Video Carousel */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {videos.map((video) => (
            <div key={video.id} className="w-60 flex-shrink-0">
              <YouTubeVideoCard 
                video={video} 
                isPlaying={playingVideo === video.videoId}
                onPlay={() => setPlayingVideo(playingVideo === video.videoId ? null : video.videoId)}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicators */}
      <div className="flex justify-center mt-2">
        <p className="text-xs text-muted-foreground">
          ← Scroll horizontal für mehr Videos →
        </p>
      </div>

    </>
  );
}

// YouTube Video Card Component with Lazy Loading

function YouTubeVideoCard({ video, isPlaying, onPlay }: { 
  video: YouTubeVideo; 
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative aspect-[9/16] bg-muted">
        {isPlaying ? (
          // Show embedded YouTube player
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          // Show thumbnail with play button
          <>
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
              onLoad={() => {
                setImageLoaded(true);
                console.log('✅ Thumbnail loaded:', video.title, video.thumbnail);
              }}
              onError={(e) => {
                console.error('❌ Thumbnail failed to load:', { 
                  video: video.title, 
                  thumbnailUrl: video.thumbnail,
                  videoId: video.videoId
                });
                // Try fallback thumbnail
                const img = e.target as HTMLImageElement;
                if (img.src.includes('mqdefault')) {
                  console.log('Trying default.jpg fallback...');
                  img.src = `https://img.youtube.com/vi/${video.videoId}/default.jpg`;
                }
              }}
            />
            
            {/* Loading placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}

            {/* Clickable play button overlay */}
            <div 
              className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 cursor-pointer ${
                isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              onClick={onPlay}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="bg-[#13B87B] rounded-full p-4 transform transition-transform group-hover:scale-110">
                <PlayCircle className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Duration badge */}
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>

            {/* Shorts badge */}
            {video.isShort && (
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                SHORTS
              </div>
            )}
          </>
        )}
      </div>

      <CardContent className="p-4">
        <h4 className="font-bold text-sm line-clamp-2 mb-2 group-hover:text-[#13B87B] transition-colors">
          {video.title}
        </h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{video.views} Aufrufe</span>
          <span>{video.publishedAt}</span>
        </div>
      </CardContent>
    </Card>
  );
}