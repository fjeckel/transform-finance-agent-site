
import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Play, Clock, Calendar, User, Search, X, ExternalLink } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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
import { SimplePDFCard } from '@/components/purchase/SimplePurchaseButton';
import { Input } from '@/components/ui/input';
import RssSubscribeButton from '@/components/RssSubscribeButton';
import { SafeHtmlRenderer } from '@/lib/content-security';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useTranslation } from 'react-i18next';

const Episodes = () => {
  const { t } = useTranslation(['episodes', 'common', 'navigation']);
  const { episodes, loading: episodesLoading, error: episodesError } = useEpisodes();
  const { pdfs, loading: pdfsLoading, error: pdfsError, incrementDownloadCount } = usePdfs();
  const location = useLocation();
  const { searchQuery: globalSearchQuery } = useGlobalSearch();
  const [selectedTab, setSelectedTab] = useState<string>('episodes');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'episode_desc' | 'episode_asc' | 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc'>('episode_desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayCount, setDisplayCount] = useState<number>(9); // Show 9 episodes initially
  const [pdfsDisplayCount, setPdfsDisplayCount] = useState<number>(9); // Show 9 PDFs initially

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
      { value: 'all', label: t('episodes:allSeries'), count: searchFiltered.length },
      { value: 'wtf', label: t('episodes:series.wtf'), count: searchFiltered.filter(e => e.series === 'wtf').length },
      { value: 'finance_transformers', label: t('episodes:series.financeTransformers'), count: searchFiltered.filter(e => e.series === 'finance_transformers').length },
      { value: 'cfo_memo', label: t('episodes:series.cfoMemo'), count: searchFiltered.filter(e => e.series === 'cfo_memo').length }
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
          <p className="mt-4 text-gray-600">{t('common:status.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('episodes:errorLoadingContent')}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-[#13B87B] transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            {t('navigation:links.goHome')}
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 pb-20 lg:pb-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-4 font-cooper">
                {t('episodes:title')}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('episodes:subtitle')}
              </p>
            </div>
            <RssSubscribeButton />
          </div>
        </div>

        {/* Main Content Tabs - Mobile Optimized */}
        <div className="mb-8">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="episodes" className="text-sm font-medium data-[state=active]:bg-[#13B87B] data-[state=active]:text-white">
                <div className="flex flex-col items-center">
                  <span>{t('episodes:allEpisodes')}</span>
                  <span className="text-xs opacity-75">({episodes.length})</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="memos" className="text-sm font-medium data-[state=active]:bg-[#13B87B] data-[state=active]:text-white">
                <div className="flex flex-col items-center">
                  <span>{t('episodes:cfoMemos')}</span>
                  <span className="text-xs opacity-75">({pdfs.length})</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="episodes" className="mt-8">
              {/* Series Filter for Episodes - Mobile Responsive */}
              <div className="mb-6">
                <div className="flex flex-col space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">{t('episodes:filterBySeries')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {seriesOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedSeries(option.value)}
                        className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all duration-200 ${
                          selectedSeries === option.value
                            ? 'bg-[#13B87B] text-white border-[#13B87B]'
                            : 'bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        <span className="block truncate">{option.label}</span>
                        <span className="block text-xs opacity-75">({option.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search and Sort Controls - Mobile Optimized */}
              <div className="mb-6 space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    type="text"
                    placeholder={t('episodes:searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 h-11"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Suche zurücksetzen"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                
                {/* Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">{t('episodes:sortBy')}</label>
                    <Select value={sortOption} onValueChange={(value) => setSortOption(value as typeof sortOption)}>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder={t('episodes:selectSortOption')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="episode_desc">{t('episodes:sortOptions.episodeDesc')}</SelectItem>
                        <SelectItem value="episode_asc">{t('episodes:sortOptions.episodeAsc')}</SelectItem>
                        <SelectItem value="date_desc">{t('episodes:sortOptions.dateDesc')}</SelectItem>
                        <SelectItem value="date_asc">{t('episodes:sortOptions.dateAsc')}</SelectItem>
                        <SelectItem value="title_asc">{t('episodes:sortOptions.titleAsc')}</SelectItem>
                        <SelectItem value="title_desc">{t('episodes:sortOptions.titleDesc')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Results Count - Mobile Info */}
                  <div className="flex items-end">
                    <div className="text-sm text-muted-foreground bg-accent px-3 py-2 rounded-lg h-11 flex items-center">
                      {(() => {
                        const count = sortedEpisodes.slice(0, displayCount).length;
                        const total = sortedEpisodes.length;
                        return t('episodes:episodeCount', { count, total });
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {searchQuery && filteredEpisodes.length > 0 && (
                <p className="text-sm text-gray-600 mb-4">
                  {t('episodes:searchResults', { count: filteredEpisodes.length, query: searchQuery })}
                </p>
              )}

              {filteredEpisodes.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {searchQuery ? t('common:messages.noResults') : t('episodes:noEpisodes')}
                  </h2>
                  <p className="text-gray-600">
                    {searchQuery 
                      ? t('episodes:noEpisodesFound', { query: searchQuery })
                      : t('episodes:noEpisodesAvailable')}
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSearchQuery('')}
                    >
{t('episodes:resetSearch')}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Episodes Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedEpisodes.slice(0, displayCount).map((episode) => (
                      <Link key={episode.id} to={`/episode/${episode.slug}`} className="block">
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
                                .filter(g => g && g.name)
                                .map(g => g.name)
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
                          
                          <div className="flex flex-col space-y-2">
                            {/* Primary CTA button - varies based on audio availability */}
                            <Button className="w-full bg-[#13B87B] hover:bg-[#0F9A6A] text-white touch-target">
                              {episode.audio_url ? (
                                <>
                                  <Play size={16} className="mr-2" />
                                  {t('episodes:toEpisode')}
                                </>
                              ) : (
                                <>
                                  <ExternalLink size={16} className="mr-2" />
                                  {t('episodes:toEpisode')}
                                </>
                              )}
                            </Button>
                            
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
                                    onClick={(e) => e.stopPropagation()}
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
                      </Link>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {displayCount < sortedEpisodes.length && (
                    <div className="text-center mt-12 mb-8">
                      <Button 
                        variant="outline" 
                        className="px-6 py-3 h-12 min-w-[200px]"
                        onClick={() => setDisplayCount(prev => Math.min(prev + 9, sortedEpisodes.length))}
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{t('episodes:loadMoreEpisodes')}</span>
                          <span className="text-xs opacity-75">{t('episodes:remainingCount', { count: sortedEpisodes.length - displayCount })}</span>
                        </div>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="memos" className="mt-8">
              {/* Search for Memos - Mobile Optimized */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    type="text"
                    placeholder={t('episodes:searchMemosPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 h-11"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Suche zurücksetzen"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                
                {/* Results Info for Memos */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      const filteredCount = searchQuery.trim() 
                        ? pdfs.filter(pdf => {
                            const searchTerm = searchQuery.toLowerCase();
                            return pdf.title?.toLowerCase().includes(searchTerm) || 
                                   pdf.description?.toLowerCase().includes(searchTerm);
                          }).length
                        : pdfs.length;
                      return t('episodes:memoCount', { count: Math.min(filteredCount, pdfsDisplayCount), total: filteredCount });
                    })()}
                  </div>
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="text-xs"
                    >
                      {t('episodes:resetFilters')}
                    </Button>
                  )}
                </div>
              </div>

              {(() => {
                const filteredPdfs = searchQuery.trim() 
                  ? pdfs.filter(pdf => {
                      const searchTerm = searchQuery.toLowerCase();
                      try {
                        return pdf.title?.toLowerCase().includes(searchTerm) ||
                          (pdf.description && pdf.description.toLowerCase().includes(searchTerm));
                      } catch (error) {
                        console.error('PDF search error:', pdf.id, error);
                        return false;
                      }
                    })
                  : pdfs;

                return filteredPdfs.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {searchQuery ? t('episodes:noMemosFound') : t('episodes:noMemosAvailable')}
                  </h2>
                  <p className="text-gray-600">
                    {searchQuery 
                      ? t('episodes:noMemosFoundDesc', { query: searchQuery })
                      : t('episodes:noMemosAvailableDesc')}
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setSearchQuery('')}
                    >
{t('episodes:resetSearch')}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {searchQuery && (
                    <p className="text-sm text-gray-600 mb-4">
                      {t('episodes:searchResults', { count: filteredPdfs.length, query: searchQuery })}
                    </p>
                  )}
                  {/* PDFs Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPdfs.slice(0, pdfsDisplayCount).map((pdf) => (
                      <SimplePDFCard 
                        key={pdf.id} 
                        pdf={pdf}
                      />
                    ))}
                  </div>
                  {/* Load More Button for PDFs */}
                  {pdfsDisplayCount < filteredPdfs.length && (
                    <div className="text-center mt-12 mb-8">
                      <Button 
                        variant="outline" 
                        className="px-6 py-3 h-12 min-w-[200px]"
                        onClick={() => setPdfsDisplayCount(prev => Math.min(prev + 9, filteredPdfs.length))}
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{t('episodes:loadMoreMemos')}</span>
                          <span className="text-xs opacity-75">{t('episodes:remainingCount', { count: filteredPdfs.length - pdfsDisplayCount })}</span>
                        </div>
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
