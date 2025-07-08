
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Play, Clock, Calendar, User, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEpisodes } from '@/hooks/useEpisodes';

const Episodes = () => {
  const { episodes, loading, error } = useEpisodes();
  const [selectedSeries, setSelectedSeries] = useState<string>('all');

  const seriesOptions = [
    { value: 'all', label: 'Alle Serien', count: episodes.length },
    { value: 'wtf', label: 'WTF', count: episodes.filter(e => e.series === 'wtf').length },
    { value: 'finance_transformers', label: 'Finance Transformers', count: episodes.filter(e => e.series === 'finance_transformers').length },
    { value: 'cfo_memo', label: 'CFO Memo', count: episodes.filter(e => e.series === 'cfo_memo').length }
  ];

  const filteredEpisodes = useMemo(() => {
    if (selectedSeries === 'all') return episodes;
    return episodes.filter(episode => episode.series === selectedSeries);
  }, [episodes, selectedSeries]);

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
            Alle Episoden
          </h1>
          <p className="text-lg text-gray-600">
            Entdecke alle Episoden unserer Podcast-Serien: WTF, Finance Transformers und CFO Memo
          </p>
        </div>

        {/* Series Filter */}
        <div className="mb-8">
          <Tabs value={selectedSeries} onValueChange={setSelectedSeries} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {seriesOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value} className="text-sm">
                  {option.label} ({option.count})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {filteredEpisodes.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Keine Episoden verfügbar</h2>
            <p className="text-gray-600">
              Es sind noch keine Episoden veröffentlicht. Schauen Sie bald wieder vorbei!
            </p>
          </div>
        ) : (
          <>
            {/* Episodes Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEpisodes.map((episode) => (
                <Card key={episode.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={episode.image_url || '/img/veronika.jpg'}
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

                    {episode.guests.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <User size={14} className="mr-1" />
                        <span>{episode.guests.map(g => g.name).join(', ')}</span>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                      {episode.description}
                    </p>
                    
                    <div className="flex space-x-2">
                      {episode.platforms.length > 0 ? (
                        episode.platforms.slice(0, 2).map((platform) => (
                          <a
                            key={platform.platform_name}
                            href={platform.platform_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button className="w-full bg-[#13B87B] hover:bg-[#0F9A6A] text-white text-xs">
                              <Play size={14} className="mr-1" />
                              {platform.platform_name}
                            </Button>
                          </a>
                        ))
                      ) : (
                        <Link to={`/episode/${episode.slug}`} className="flex-1">
                          <Button className="w-full bg-[#13B87B] hover:bg-[#0F9A6A] text-white">
                            <Play size={16} className="mr-2" />
                            Zur Episode
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            <div className="text-center mt-12">
              <Button variant="outline" className="px-8 py-3">
                Weitere Episoden laden
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Episodes;
