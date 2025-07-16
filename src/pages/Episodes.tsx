
import React, { useState, useMemo } from 'react';
import { ArrowLeft, ExternalLink, Clock, Users, Mic, Download, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useContent, ContentItem } from '@/hooks/useContent';
import { ContentCard } from '@/components/ui/content-card';

// Types
type ContentFilter = 'all' | 'episodes' | 'pdfs';

type SeriesOption = {
  value: string;
  label: string;
};

const Episodes: React.FC = () => {
  const { content, loading, error } = useContent();
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');

  const seriesOptions: SeriesOption[] = [
    { value: 'all', label: 'Alle Serien' },
    { value: 'wtf', label: 'WTF' },
    { value: 'finance_transformers', label: 'Finance Transformers' },
    { value: 'cfo_memo', label: 'CFO Memo' }
  ];

  // Filter content based on selected filters
  const filteredContent = useMemo(() => {
    let filtered = content;
    
    // Filter by content type
    if (contentFilter === 'episodes') {
      filtered = filtered.filter(item => item.type === 'episode');
    } else if (contentFilter === 'pdfs') {
      filtered = filtered.filter(item => item.type === 'pdf');
    }
    
    // Filter by series (only for episodes)
    if (selectedSeries !== 'all') {
      filtered = filtered.filter(item => 
        item.type === 'pdf' || item.series === selectedSeries
      );
    }
    
    return filtered;
  }, [content, selectedSeries, contentFilter]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13B87B] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading episodes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Episodes</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-[#13B87B] transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Zurück zur Startseite
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-cooper">
            Alle Inhalte
          </h1>
          <p className="text-lg text-gray-600">
            Entdecke alle Episoden und Downloads unserer Podcast-Serien
          </p>
        </div>

        {/* Content Type Filter */}
        <div className="mb-6">
          <Tabs value={contentFilter} onValueChange={(value: string) => setContentFilter(value as ContentFilter)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="episodes">Episoden</TabsTrigger>
              <TabsTrigger value="pdfs">PDFs</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Series Filter (only show for episodes or all) */}
        {(contentFilter === 'all' || contentFilter === 'episodes') && (
          <div className="mb-8">
            <Tabs value={selectedSeries} onValueChange={setSelectedSeries} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {seriesOptions.map((option) => (
                  <TabsTrigger key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Content Grid */}
        {filteredContent.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Keine Inhalte verfügbar</h2>
            <p className="text-gray-600">
              Für die ausgewählten Filter sind keine Inhalte verfügbar.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>

            {/* Load More Button */}
            <div className="text-center mt-12">
              <Button variant="outline" className="px-8 py-3">
                Weitere Inhalte laden
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Episodes;
