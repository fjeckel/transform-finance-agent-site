import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlayCircle, Search, Mic2, Rocket, Headphones, ArrowRight, 
  Mail, Star, Calendar, Filter, ChevronRight, Users2, 
  BookOpen, TrendingUp, Target, Lightbulb, Globe
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { useEpisodes } from '@/hooks/useEpisodes';
import { useInsights } from '@/hooks/useInsights';

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

interface ContentItem {
  id: string;
  title: string;
  type: 'episode' | 'insight';
  date: string;
  author?: string;
  guest?: string;
  duration?: number;
  tags: string[];
  description: string;
  slug: string;
  cover?: string;
}

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'episodes' | 'insights'>('all');
  
  const { data: episodesData, isLoading: episodesLoading } = useEpisodes();
  const { data: insightsData, isLoading: insightsLoading } = useInsights();
  const navigate = useNavigate();

  // Transform data into unified content format
  const allContent = useMemo(() => {
    const episodes: ContentItem[] = (episodesData || []).map(ep => ({
      id: ep.id,
      title: ep.title,
      type: 'episode' as const,
      date: ep.created_at,
      guest: ep.guest_name || undefined,
      duration: ep.duration_minutes,
      tags: ep.tags || [],
      description: ep.description || '',
      slug: ep.slug,
      cover: ep.cover_image_url
    }));

    const insights: ContentItem[] = (insightsData || []).map(insight => ({
      id: insight.id,
      title: insight.title,
      type: 'insight' as const,
      date: insight.created_at,
      author: insight.author_name,
      tags: insight.tags || [],
      description: insight.excerpt || insight.content?.substring(0, 200) + '...' || '',
      slug: insight.slug
    }));

    return [...episodes, ...insights].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [episodesData, insightsData]);

  // Filter content
  const filteredContent = useMemo(() => {
    return allContent.filter(item => {
      // Tab filter
      if (activeTab !== 'all' && item.type !== activeTab.slice(0, -1)) return false;
      
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        (item.guest && item.guest.toLowerCase().includes(searchLower)) ||
        (item.author && item.author.toLowerCase().includes(searchLower));
      
      // Tags filter
      const matchesTags = activeTags.length === 0 || 
        activeTags.some(tag => item.tags.includes(tag));
      
      return matchesSearch && matchesTags;
    });
  }, [allContent, searchQuery, activeTags, activeTab]);

  const toggleTag = (tag: string) => {
    setActiveTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const featuredContent = allContent[0];

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
                <Button variant="outline" size="lg" className="font-cooper">
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
                    {featuredContent.cover && (
                      <img 
                        src={featuredContent.cover} 
                        alt={featuredContent.title}
                        className="h-48 w-full object-cover"
                      />
                    )}
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary">
                        {featuredContent.type === 'episode' ? 'Neueste Folge' : 'Neuester Insight'}
                      </Badge>
                      {featuredContent.duration && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <PlayCircle className="h-4 w-4" />
                          {featuredContent.duration} Min
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 font-cooper leading-tight">
                      {featuredContent.title}
                    </h3>
                    
                    {(featuredContent.guest || featuredContent.author) && (
                      <p className="text-muted-foreground mb-3">
                        {featuredContent.guest ? `Gast: ${featuredContent.guest}` : `von ${featuredContent.author}`}
                      </p>
                    )}
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {featuredContent.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {featuredContent.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full bg-[#13B87B] hover:bg-[#0FA66A] font-cooper"
                      onClick={() => navigate(
                        featuredContent.type === 'episode' 
                          ? `/episode/${featuredContent.slug}` 
                          : `/insights/${featuredContent.slug}`
                      )}
                    >
                      {featuredContent.type === 'episode' ? 'Jetzt anhören' : 'Jetzt lesen'}
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

      {/* Content Browser Section */}
      <section id="content-section" className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header & Search */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-[#13B87B]" />
                <h2 className="text-2xl font-bold font-cooper">Durchsuche alle Inhalte</h2>
              </div>
              
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suche nach Themen, Gästen oder Inhalten..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">Alle Inhalte</TabsTrigger>
                <TabsTrigger value="episodes">Podcast Folgen</TabsTrigger>
                <TabsTrigger value="insights">Artikel & Insights</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {CONTENT_TAGS.map(tag => (
                <Button
                  key={tag}
                  size="sm"
                  variant={activeTags.includes(tag) ? "default" : "outline"}
                  className={`rounded-full ${activeTags.includes(tag) ? 'bg-[#13B87B] hover:bg-[#0FA66A]' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Button>
              ))}
              {activeTags.length > 0 && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setActiveTags([])}
                  className="rounded-full"
                >
                  Filter zurücksetzen
                </Button>
              )}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(episodesLoading || insightsLoading) ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="p-0">
                    <div className="h-40 bg-muted animate-pulse" />
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : filteredContent.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Inhalte gefunden für deine Filterkriterien.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveTags([]);
                      setActiveTab('all');
                    }}
                  >
                    Alle Filter zurücksetzen
                  </Button>
                </div>
              </div>
            ) : (
              filteredContent.map((item, index) => (
                <ContentCard key={item.id} content={item} index={index} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#13B87B] to-[#0FA66A] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-600">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-cooper">
              Verpasse keine Finance Transformation
            </h2>
            <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
              Erhalte neue Folgen, exklusive Insights und praktische Playbooks direkt in dein Postfach.
            </p>
            
            <div className="max-w-md mx-auto flex gap-3">
              <Input 
                placeholder="deine@email.com" 
                className="bg-white text-gray-900 border-0 flex-1"
              />
              <Button variant="secondary" className="bg-white text-[#13B87B] hover:bg-gray-100 font-bold px-8">
                <Mail className="mr-2 h-4 w-4" />
                Abonnieren
              </Button>
            </div>
            
            <p className="text-sm text-green-100 mt-4">
              Kostenlos. Jederzeit kündbar. Kein Spam.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContentCard({ content, index }: { content: ContentItem; index: number }) {
  const navigate = useNavigate();
  
  return (
    <div className="opacity-0 animate-in fade-in slide-in-from-bottom-2 duration-500" 
         style={{ animationDelay: `${index * 150}ms` }}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full group">
        <CardHeader className="p-0">
          {content.cover ? (
            <img 
              src={content.cover} 
              alt={content.title}
              className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-40 bg-gradient-to-br from-[#13B87B]/20 to-[#13B87B]/5 flex items-center justify-center">
              {content.type === 'episode' ? (
                <Headphones className="h-8 w-8 text-[#13B87B]" />
              ) : (
                <BookOpen className="h-8 w-8 text-[#13B87B]" />
              )}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-4 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-3">
            <Badge variant={content.type === 'episode' ? 'default' : 'secondary'}>
              {content.type === 'episode' ? 'Podcast' : 'Artikel'}
            </Badge>
            {content.duration && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <PlayCircle className="h-3 w-3" />
                {content.duration} Min
              </span>
            )}
          </div>
          
          <h3 className="font-bold text-sm leading-tight mb-2 line-clamp-2 group-hover:text-[#13B87B] transition-colors">
            {content.title}
          </h3>
          
          {(content.guest || content.author) && (
            <p className="text-xs text-muted-foreground mb-2">
              {content.guest ? `Gast: ${content.guest}` : `von ${content.author}`}
            </p>
          )}
          
          <p className="text-xs text-muted-foreground mb-4 line-clamp-3 flex-1">
            {content.description}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-4">
            {content.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <Button 
            size="sm" 
            className="w-full bg-[#13B87B] hover:bg-[#0FA66A] text-white"
            onClick={() => navigate(
              content.type === 'episode' 
                ? `/episode/${content.slug}` 
                : `/insights/${content.slug}`
            )}
          >
            {content.type === 'episode' ? (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Anhören
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Lesen
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}