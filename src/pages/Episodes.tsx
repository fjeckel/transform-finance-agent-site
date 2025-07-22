
import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Play, Clock, Calendar, User, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEpisodes } from '@/hooks/useEpisodes';
import { usePdfs } from '@/hooks/usePdfs';
import { PDFCard } from '@/components/ui/pdf-card';
import { Input } from '@/components/ui/input';
import RssSubscribeButton from '@/components/RssSubscribeButton';

const Episodes = () => {
  const { episodes, loading: episodesLoading, error: episodesError } = useEpisodes();
  const { pdfs, loading: pdfsLoading, error: pdfsError, incrementDownloadCount } = usePdfs();
  const [selectedTab, setSelectedTab] = useState<string>('episodes');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'episode_desc' | 'episode_asc' | 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc'>('episode_desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayCount, setDisplayCount] = useState<number>(9); // Show 9 episodes initially
  const [pdfsDisplayCount, setPdfsDisplayCount] = useState<number>(9); // Show 9 PDFs initially

  // Reset display count when search query or series filter changes
  useEffect(() => {
    setDisplayCount(9);
    setPdfsDisplayCount(9);
  }, [searchQuery, selectedSeries]);

  const seriesOptions = useMemo(() => {
    const searchFiltered = searchQuery.trim() 
      ? episodes.filter(episode => {
          const query = searchQuery.toLowerCase();
          try {
            return episode.title?.toLowerCase().includes(query) ||
              (episode.description && episode.description.toLowerCase().includes(query)) ||
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

  const filteredEpisodes = useMemo(() => {
    let filtered = episodes;
    
    // Filter by series
    if (selectedSeries !== 'all') {
      filtered = filtered.filter(episode => episode.series === selectedSeries);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(episode => {
        try {
          // Search in title
          if (episode.title?.toLowerCase().includes(query)) return true;
          
          // Search in description
          if (episode.description && episode.description.toLowerCase().includes(query)) return true;
          
          // Search in guest names
          if (episode.guests && Array.isArray(episode.guests) && episode.guests.some(guest => 
            guest && guest.name && guest.name.toLowerCase().includes(query)
          )) return true;
          
          // Search in series name
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

  const sortedEpisodes = useMemo(() => {
    const sorted = [...filteredEpisodes];
    sorted.sort((a, b) => {
      switch (sortOption) {
        case 'episode_asc':
          // Sort by season, then episode_number ascending
          if (a.season !== b.season) return a.season - b.season;
          return a.episode_number - b.episode_number;
        case 'episode_desc':
          // Sort by season, then episode_number descending
          if (a.season !== b.season) return b.season - a.season;
          return b.episode_number - a.episode_number;
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

  const loading = episodesLoading || pdfsLoading;
  const error = episodesError || pdfsError;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13B87B] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Content</h2>
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 font-cooper">
                Alle Inhalte
              </h1>
              <p className="text-lg text-gray-600">
                Entdecke alle Episoden unserer Podcast-Serien und unsere CFO Memos
              </p>
            </div>
            <RssSubscribeButton />
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="mb-8">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="episodes" className="text-sm">
                Alle Episoden ({episodes.length})
              </TabsTrigger>
              <TabsTrigger value="memos" className="text-sm">
                Memos ({pdfs.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="episodes" className="mt-8">
              {/* Series Filter for Episodes */}
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

              {/* Search and Sort Controls */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Suche nach Titel, Gast oder Beschreibung..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
                <Select value={sortOption} onValueChange={(value) => setSortOption(value as typeof sortOption)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sortierung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="episode_desc">Neueste Episode zuerst</SelectItem>
                    <SelectItem value="episode_asc">Älteste Episode zuerst</SelectItem>
                    <SelectItem value="date_desc">Neueste nach Datum</SelectItem>
                    <SelectItem value="date_asc">Älteste nach Datum</SelectItem>
                    <SelectItem value="title_asc">Titel A-Z</SelectItem>
                    <SelectItem value="title_desc">Titel Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {searchQuery && filteredEpisodes.length > 0 && (
                <p className="text-sm text-gray-600 mb-4">
                  {filteredEpisodes.length} {filteredEpisodes.length === 1 ? 'Ergebnis' : 'Ergebnisse'} für "{searchQuery}"
                </p>
              )}

              {filteredEpisodes.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {searchQuery ? 'Keine Ergebnisse gefunden' : 'Keine Episoden verfügbar'}
                  </h2>
                  <p className="text-gray-600">
                    {searchQuery 
                      ? `Keine Episoden für "${searchQuery}" gefunden. Versuchen Sie es mit anderen Suchbegriffen.`
                      : 'Es sind noch keine Episoden veröffentlicht. Schauen Sie bald wieder vorbei!'}
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSearchQuery('')}
                    >
                      Suche zurücksetzen
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Episodes Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedEpisodes.slice(0, displayCount).map((episode) => (
                      <Card key={episode.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
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
                                .filter(g => g && g.name)
                                .map(g => g.name)
                                .join(', ')}</span>
                            </div>
                          )}
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                            {episode.description}
                          </p>
                          
                          <div className="flex flex-col space-y-2">
                            {/* Always show "View Episode" button */}
                            <Link to={`/episode/${episode.slug}`} className="w-full">
                              <Button className="w-full bg-[#13B87B] hover:bg-[#0F9A6A] text-white">
                                <Play size={16} className="mr-2" />
                                Episode ansehen
                              </Button>
                            </Link>
                            
                            {/* Show platform links if available */}
                            {episode.platforms.length > 0 && (
                              <div className="flex space-x-2">
                                {episode.platforms.slice(0, 2).map((platform) => (
                                  <a
                                    key={platform.platform_name}
                                    href={platform.platform_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1"
                                  >
                                    <Button variant="outline" className="w-full text-xs">
                                      {platform.platform_name}
                                    </Button>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {displayCount < sortedEpisodes.length && (
                    <div className="text-center mt-12">
                      <Button 
                        variant="outline" 
                        className="px-8 py-3"
                        onClick={() => setDisplayCount(prev => Math.min(prev + 9, sortedEpisodes.length))}
                      >
                        Weitere Episoden laden ({sortedEpisodes.length - displayCount} verbleibend)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="memos" className="mt-8">
              {/* Search for Memos */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    type="text"
                    placeholder="Suche nach Memo-Titel oder Beschreibung..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>

              {(() => {
                const filteredPdfs = searchQuery.trim() 
                  ? pdfs.filter(pdf => {
                      const query = searchQuery.toLowerCase();
                      try {
                        return pdf.title?.toLowerCase().includes(query) ||
                          (pdf.description && pdf.description.toLowerCase().includes(query));
                      } catch (error) {
                        console.error('PDF search error:', pdf.id, error);
                        return false;
                      }
                    })
                  : pdfs;

                return filteredPdfs.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {searchQuery ? 'Keine Memos gefunden' : 'Keine Memos verfügbar'}
                  </h2>
                  <p className="text-gray-600">
                    {searchQuery 
                      ? `Keine Memos für "${searchQuery}" gefunden. Versuchen Sie es mit anderen Suchbegriffen.`
                      : 'Es sind noch keine Memos veröffentlicht. Schauen Sie bald wieder vorbei!'}
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSearchQuery('')}
                    >
                      Suche zurücksetzen
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {searchQuery && (
                    <p className="text-sm text-gray-600 mb-4">
                      {filteredPdfs.length} {filteredPdfs.length === 1 ? 'Ergebnis' : 'Ergebnisse'} für "{searchQuery}"
                    </p>
                  )}
                  {/* PDFs Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPdfs.slice(0, pdfsDisplayCount).map((pdf) => (
                      <PDFCard 
                        key={pdf.id} 
                        pdf={pdf} 
                        onDownload={incrementDownloadCount}
                      />
                    ))}
                  </div>
                  {/* Load More Button for PDFs */}
                  {pdfsDisplayCount < filteredPdfs.length && (
                    <div className="text-center mt-12">
                      <Button 
                        variant="outline" 
                        className="px-8 py-3"
                        onClick={() => setPdfsDisplayCount(prev => Math.min(prev + 9, filteredPdfs.length))}
                      >
                        Weitere Memos laden ({filteredPdfs.length - pdfsDisplayCount} verbleibend)
                      </Button>
                    </div>
                  )}
                </>
              );
              })()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Episodes;
