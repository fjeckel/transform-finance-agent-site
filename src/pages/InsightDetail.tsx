import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, BookOpen, FileText, Users, TrendingUp, Star, Eye, Tag, Share2, Download } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';
import { MobileSearch } from '@/components/ui/mobile-search';
import { useInsightBySlug, useInsights, InsightType, DifficultyLevel } from '@/hooks/useInsights';
import { useInsightAnalytics } from '@/hooks/useInsightAnalytics';
import { RecommendedContent } from '@/components/RecommendedContent';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

const InsightDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  const { data: insight, isLoading, error } = useInsightBySlug(slug || '');
  const { data: relatedInsights = [] } = useInsights({ 
    type: insight?.insight_type, 
    limit: 3 
  });

  // Get current user for personalized recommendations
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Initialize analytics tracking
  const analyticsActions = useInsightAnalytics({
    insightId: insight?.id || '',
    insightTitle: insight?.title || '',
    insightType: insight?.insight_type || '',
    readingTime: insight?.reading_time_minutes,
  });

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
      case 'book_summary': return 'Buchzusammenfassung';
      case 'blog_article': return 'Artikel';
      case 'guide': return 'Leitfaden';
      case 'case_study': return 'Fallstudie';
      default: return 'Artikel';
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
      case 'beginner': return 'Einsteiger';
      case 'intermediate': return 'Fortgeschritten';
      case 'advanced': return 'Experte';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-background border-b border-border sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Insight nicht gefunden</h1>
          <Link to="/insights" className="text-[#13B87B] hover:underline">
            Zurück zu den Insights
          </Link>
        </div>
      </div>
    );
  }

  const TypeIcon = getTypeIcon(insight.insight_type);
  const filteredRelated = relatedInsights.filter(related => related.id !== insight.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={`${insight.title} - Finance Transformers Insights`}
        description={insight.description || insight.summary || `${getTypeLabel(insight.insight_type)}: ${insight.title}`}
        image={insight.image_url}
      />
      
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/insights" className="inline-flex items-center text-muted-foreground hover:text-[#13B87B] transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Zurück zu den Insights
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 pb-20 lg:pb-8">
        {/* Hero Section */}
        <div className="mb-8">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="secondary" className="flex items-center gap-1">
              <TypeIcon size={12} />
              {getTypeLabel(insight.insight_type)}
            </Badge>
            
            {insight.difficulty_level && (
              <Badge className={getDifficultyColor(insight.difficulty_level)}>
                {getDifficultyLabel(insight.difficulty_level)}
              </Badge>
            )}

            {insight.featured && (
              <Badge className="bg-yellow-500 text-white">
                <Star size={12} className="mr-1" />
                Featured
              </Badge>
            )}

            {insight.insights_categories && (
              <Badge variant="outline">
                {insight.insights_categories.name}
              </Badge>
            )}
          </div>

          {/* Title and Subtitle */}
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 font-cooper">
            {insight.title}
          </h1>
          
          {insight.subtitle && (
            <p className="text-xl text-muted-foreground mb-6">
              {insight.subtitle}
            </p>
          )}

          {/* Book Info (if book summary) */}
          {insight.insight_type === 'book_summary' && (
            <div className="bg-accent/50 p-6 rounded-lg mb-6">
              <h3 className="font-semibold text-foreground mb-2 flex items-center">
                <BookOpen size={20} className="mr-2" />
                Über das Buch
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {insight.book_title && (
                  <div>
                    <span className="font-medium text-muted-foreground">Titel:</span>
                    <p className="text-foreground">{insight.book_title}</p>
                  </div>
                )}
                {insight.book_author && (
                  <div>
                    <span className="font-medium text-muted-foreground">Autor:</span>
                    <p className="text-foreground">{insight.book_author}</p>
                  </div>
                )}
                {insight.book_publication_year && (
                  <div>
                    <span className="font-medium text-muted-foreground">Jahr:</span>
                    <p className="text-foreground">{insight.book_publication_year}</p>
                  </div>
                )}
                {insight.book_isbn && (
                  <div>
                    <span className="font-medium text-muted-foreground">ISBN:</span>
                    <p className="text-foreground">{insight.book_isbn}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
            {insight.reading_time_minutes && (
              <div className="flex items-center gap-1">
                <Clock size={16} />
                {insight.reading_time_minutes} Min Lesezeit
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Eye size={16} />
              {insight.view_count} Aufrufe
            </div>

            {insight.published_at && (
              <div>
                Veröffentlicht am {formatDate(insight.published_at)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                analyticsActions.trackShare('generic');
                // Here you would implement actual sharing functionality
                navigator.share?.({
                  title: insight.title,
                  text: insight.description || insight.summary,
                  url: window.location.href,
                }).catch(() => {
                  // Fallback to clipboard
                  navigator.clipboard.writeText(window.location.href);
                });
              }}
            >
              <Share2 size={16} className="mr-2" />
              Teilen
            </Button>
            {insight.insight_type === 'book_summary' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  analyticsActions.trackDownload('pdf');
                  // Here you would implement actual PDF download functionality
                }}
              >
                <Download size={16} className="mr-2" />
                PDF Download
              </Button>
            )}
          </div>
        </div>

        {/* Hero Image */}
        {insight.image_url && (
          <div className="mb-8">
            <img 
              src={insight.image_url} 
              alt={insight.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Summary */}
        {insight.summary && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-6 h-6 bg-[#13B87B] rounded mr-3"></div>
                Zusammenfassung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {insight.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-foreground mb-4 font-cooper">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold text-foreground mb-3 mt-6 font-cooper">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">{children}</h3>,
                  p: ({ children }) => <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>,
                  ul: ({ children }) => <ul className="text-muted-foreground space-y-2 mb-4 ml-6">{children}</ul>,
                  ol: ({ children }) => <ol className="text-muted-foreground space-y-2 mb-4 ml-6">{children}</ol>,
                  li: ({ children }) => <li className="list-disc">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-[#13B87B] pl-4 italic text-muted-foreground my-4">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-accent px-2 py-1 rounded text-sm text-foreground">
                      {children}
                    </code>
                  ),
                }}
              >
                {insight.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        {insight.tags && insight.tags.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Tag size={18} className="mr-2" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {insight.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommended Content */}
        <div className="mb-8">
          <RecommendedContent
            currentContentId={insight?.id}
            userId={currentUser || undefined}
            maxItems={6}
            showTabs={true}
            variant="detailed"
          />
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-[#13B87B]/10 to-[#003FA5]/10 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-foreground mb-4 font-cooper">
            Mehr Finance Insights entdecken
          </h3>
          <p className="text-muted-foreground mb-6">
            Erweitere dein Wissen mit weiteren Buchzusammenfassungen, Artikeln und Leitfäden.
          </p>
          <Button asChild size="lg">
            <Link to="/insights">
              Alle Insights ansehen
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile Search */}
      <MobileSearch open={mobileSearchOpen} onOpenChange={setMobileSearchOpen} />
      
      {/* Bottom Navigation - Mobile Only */}
    </div>
  );
};

export default InsightDetail;