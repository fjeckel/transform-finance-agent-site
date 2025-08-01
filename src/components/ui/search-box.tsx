import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Clock, Headphones, FileText, Loader2, Trash2, BookOpen, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useEpisodes } from '@/hooks/useEpisodes';
import { usePdfs } from '@/hooks/usePdfs';
import { useInsights } from '@/hooks/useInsights';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { highlightSearchTerms } from '@/utils/searchHighlight';
import { cn } from '@/lib/utils';

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface SearchFilter {
  episodes: boolean;
  insights: boolean;
  pdfs: boolean;
}

interface SearchBoxProps {
  mobile?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ 
  mobile = false, 
  open: controlledOpen, 
  onOpenChange, 
  className 
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilter>({
    episodes: true,
    insights: true,
    pdfs: true
  });
  const navigate = useNavigate();
  const { episodes = [], loading: episodesLoading, error: episodesError } = useEpisodes();
  const { pdfs = [], loading: pdfsLoading, error: pdfsError } = usePdfs();
  const { data: insights = [], isLoading: insightsLoading, error: insightsError } = useInsights();
  const { addToHistory, getRecentSearches, removeFromHistory, clearHistory } = useSearchHistory();
  
  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  // Debounce search query for performance
  const debouncedQuery = useDebounce(query, 300);
  
  // Loading state
  const isLoading = episodesLoading || pdfsLoading || insightsLoading || isSearching;
  
  // Check for data loading errors
  const hasDataErrors = episodesError || pdfsError || insightsError;
  
  // Get recent searches
  const recentSearches = getRecentSearches(mobile ? 8 : 5);

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Escape key to close search
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  // Enhanced search function with scoring
  const searchWithScore = (text: string, searchTerm: string, weight: number = 1): number => {
    if (!text) return 0;
    const lowerText = text.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    
    // Exact match gets highest score
    if (lowerText === lowerTerm) return 100 * weight;
    
    // Title/word boundary matches get high score
    if (lowerText.includes(` ${lowerTerm} `) || lowerText.startsWith(`${lowerTerm} `)) {
      return 80 * weight;
    }
    
    // Partial matches get medium score
    if (lowerText.includes(lowerTerm)) {
      const index = lowerText.indexOf(lowerTerm);
      // Earlier matches get higher scores
      const positionScore = Math.max(0, 50 - (index / lowerText.length) * 30);
      return positionScore * weight;
    }
    
    return 0;
  };

  // Filter and score all content based on debounced search query
  const { filteredEpisodes, filteredPdfs, filteredInsights } = useMemo(() => {
    if (!debouncedQuery) {
      return { filteredEpisodes: [], filteredPdfs: [], filteredInsights: [] };
    }
    
    const searchTerm = debouncedQuery.toLowerCase();
    const maxResults = mobile ? 6 : 4;
    
    // Score and filter episodes
    const episodeResults = filters.episodes && episodes ? episodes
      .map(episode => {
        const titleScore = searchWithScore(episode?.title || '', searchTerm, 3);
        const summaryScore = searchWithScore(episode?.summary || '', searchTerm, 2);
        const descriptionScore = searchWithScore(episode?.description || '', searchTerm, 1.5);
        const contentScore = searchWithScore(episode?.content || '', searchTerm, 1);
        const totalScore = titleScore + summaryScore + descriptionScore + contentScore;
        
        return { ...episode, score: totalScore };
      })
      .filter(episode => episode.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults) : [];

    // Score and filter PDFs
    const pdfResults = filters.pdfs && pdfs ? pdfs
      .map(pdf => {
        const titleScore = searchWithScore(pdf?.title || '', searchTerm, 3);
        const descriptionScore = searchWithScore(pdf?.description || '', searchTerm, 2);
        const totalScore = titleScore + descriptionScore;
        
        return { ...pdf, score: totalScore };
      })
      .filter(pdf => pdf.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults) : [];

    // Score and filter insights
    const insightResults = filters.insights && insights ? insights
      .map(insight => {
        const titleScore = searchWithScore(insight?.title || '', searchTerm, 3);
        const descriptionScore = searchWithScore(insight?.description || '', searchTerm, 2);
        const contentScore = searchWithScore(insight?.content || '', searchTerm, 1);
        const categoryScore = searchWithScore(insight?.category || '', searchTerm, 1.5);
        const bookTitleScore = searchWithScore(insight?.book_title || '', searchTerm, 2);
        const bookAuthorScore = searchWithScore(insight?.book_author || '', searchTerm, 1.5);
        const totalScore = titleScore + descriptionScore + contentScore + categoryScore + bookTitleScore + bookAuthorScore;
        
        return { ...insight, score: totalScore };
      })
      .filter(insight => insight.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults) : [];
    
    return { 
      filteredEpisodes: episodeResults, 
      filteredPdfs: pdfResults,
      filteredInsights: insightResults
    };
  }, [debouncedQuery, episodes, pdfs, insights, mobile, filters]);

  const handleSelect = (type: string, id: string, slug?: string) => {
    // Add search to history if there was a query
    if (query.trim()) {
      const resultCount = filteredEpisodes.length + filteredPdfs.length + filteredInsights.length;
      const searchType = type === 'episode' ? 'episode' : type === 'pdf' ? 'pdf' : type === 'insight' ? 'insight' : 'general';
      addToHistory(query, resultCount, searchType);
    }
    
    setOpen(false);
    setQuery('');
    setIsSearching(false);
    
    if (type === 'episode') {
      navigate(`/episode/${slug}`);
    } else if (type === 'pdf') {
      navigate(`/report/${id}`);
    } else if (type === 'insight') {
      navigate(`/insights/${slug}`);
    } else if (type === 'route') {
      navigate(id);
    } else if (type === 'search-history') {
      // Handle search history item selection
      setQuery(id); // id contains the search query for history items
      // Don't close the search, let user see results
    }
  };

  // Toggle filter
  const toggleFilter = (filterType: keyof SearchFilter) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };
  
  // Handle search input change with loading state
  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (value && !isSearching) {
      setIsSearching(true);
      // Reset searching state after debounce period
      setTimeout(() => setIsSearching(false), 350);
    }
  };

  return (
    <>
      {/* Search Trigger Button - Only show for desktop mode */}
      {!mobile && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className={cn(
            "relative h-9 w-full justify-start rounded-md bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-56",
            className
          )}
          aria-label="Suche öffnen"
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline-flex">Suchen...</span>
          <span className="inline-flex lg:hidden">Suchen</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}

      {/* Search Dialog */}
      <CommandDialog 
        open={open} 
        onOpenChange={setOpen}
        aria-describedby="search-description"
        aria-label="Suchfenster"
      >
        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            placeholder={mobile ? "Suchen..." : "Episoden, Insights, PDFs suchen..."}
            value={query}
            onValueChange={handleSearchChange}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Suchfeld"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="mr-2 h-8 w-8 p-0 hover:bg-muted"
            aria-label="Filter anzeigen"
          >
            <Filter className="h-4 w-4" />
          </Button>
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0 opacity-50" />
          )}
        </div>
        
        {/* Search Filters */}
        {showFilters && (
          <div className="border-b px-3 py-2">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">Filter:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFilter('episodes')}
                className={cn(
                  "h-6 px-2 text-xs",
                  filters.episodes ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                <Headphones className="mr-1 h-3 w-3" />
                Episoden
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFilter('insights')}
                className={cn(
                  "h-6 px-2 text-xs",
                  filters.insights ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                <BookOpen className="mr-1 h-3 w-3" />
                Insights
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFilter('pdfs')}
                className={cn(
                  "h-6 px-2 text-xs",
                  filters.pdfs ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                <FileText className="mr-1 h-3 w-3" />
                PDFs
              </Button>
            </div>
          </div>
        )}
        <CommandList className={mobile ? "max-h-[60vh]" : "max-h-[300px]"}>
          {hasDataErrors && (
            <div className="py-4 px-3 border-b">
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                ⚠️ Einige Inhalte können nicht geladen werden. Bitte versuchen Sie es später erneut.
              </div>
            </div>
          )}
          <CommandEmpty>
            <div className="py-6 text-center text-sm">
              <Search className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Keine Ergebnisse für "{query}" gefunden.</p>
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <p>Versuchen Sie:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Andere Suchbegriffe</li>
                  <li>Allgemeinere Begriffe</li>
                  <li>Überprüfen Sie die Rechtschreibung</li>
                </ul>
              </div>
              {recentSearches.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Oder wählen Sie eine vorherige Suche:</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {recentSearches.slice(0, 3).map((item) => (
                      <Button
                        key={item.id}
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={() => handleSelect('search-history', item.query)}
                      >
                        {item.query}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CommandEmpty>
          
          {/* Quick Actions */}
          {!query && (
            <CommandGroup heading="Schnellzugriff">
              <CommandItem
                onSelect={() => handleSelect('route', '/episodes')}
                className="flex items-center gap-2 cursor-pointer"
                role="option"
              >
                <Headphones className="h-4 w-4" />
                Alle Episoden
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect('route', '/insights')}
                className="flex items-center gap-2 cursor-pointer"
                role="option"
              >
                <BookOpen className="h-4 w-4" />
                Alle Insights
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect('route', '/episodes?tab=memos')}
                className="flex items-center gap-2 cursor-pointer"
                role="option"
              >
                <FileText className="h-4 w-4" />
                CFO Memos
              </CommandItem>
              {mobile && (
                <CommandItem
                  onSelect={() => handleSelect('route', '/')}
                  className="flex items-center gap-2 cursor-pointer"
                  role="option"
                >
                  <Search className="h-4 w-4" />
                  Startseite
                </CommandItem>
              )}
            </CommandGroup>
          )}

          {/* Episodes Results */}
          {filteredEpisodes.length > 0 && (
            <CommandGroup heading={`Podcast Episoden (${filteredEpisodes.length})`}>
              {filteredEpisodes.map((episode) => (
                <CommandItem
                  key={episode.id}
                  onSelect={() => handleSelect('episode', episode.id, episode.slug)}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  role="option"
                  aria-label={`Episode: ${episode.title}`}
                >
                  <Headphones className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium line-clamp-2 text-sm">
                      {highlightSearchTerms(episode.title || '', debouncedQuery)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      S{episode?.season || 0}E{episode?.episode_number || 0}
                      {episode?.duration && ` • ${episode.duration}`}
                    </span>
                    {episode?.description && mobile && (
                      <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {highlightSearchTerms(episode.description, debouncedQuery)}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Insights Results */}
          {filteredInsights.length > 0 && (
            <CommandGroup heading={`Insights (${filteredInsights.length})`}>
              {filteredInsights.map((insight) => (
                <CommandItem
                  key={insight.id}
                  onSelect={() => handleSelect('insight', insight.id, insight.slug)}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  role="option"
                  aria-label={`Insight: ${insight.title}`}
                >
                  <BookOpen className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium line-clamp-2 text-sm">
                      {highlightSearchTerms(insight.title || '', debouncedQuery)}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{insight?.insight_type?.replace('_', ' ') || 'Insight'}</span>
                      {insight?.reading_time_minutes && <span>• {insight.reading_time_minutes} Min</span>}
                      {insight?.difficulty_level && <span>• {insight.difficulty_level}</span>}
                    </div>
                    {insight?.book_title && (
                      <span className="text-xs text-muted-foreground mt-1">
                        📚 {highlightSearchTerms(insight.book_title, debouncedQuery)}
                        {insight?.book_author && ` von ${highlightSearchTerms(insight.book_author, debouncedQuery)}`}
                      </span>
                    )}
                    {insight?.description && mobile && (
                      <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {highlightSearchTerms(insight.description, debouncedQuery)}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* PDFs Results */}
          {filteredPdfs.length > 0 && (
            <CommandGroup heading={`CFO Memos & Reports (${filteredPdfs.length})`}>
              {filteredPdfs.map((pdf) => (
                <CommandItem
                  key={pdf.id}
                  onSelect={() => handleSelect('pdf', pdf.id)}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  role="option"
                  aria-label={`PDF: ${pdf.title}`}
                >
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium line-clamp-2 text-sm">
                      {highlightSearchTerms(pdf.title || '', debouncedQuery)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {pdf?.is_premium ? 'Premium' : 'Kostenlos'}
                      {pdf?.price && ` • €${pdf.price}`}
                    </span>
                    {pdf?.description && mobile && (
                      <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {highlightSearchTerms(pdf.description, debouncedQuery)}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <CommandGroup heading="Zuletzt gesucht">
              {recentSearches.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect('search-history', item.query)}
                  className="flex items-center justify-between gap-2 cursor-pointer group"
                  role="option"
                  aria-label={`Suche wiederholen: ${item.query}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{item.query}</span>
                    <span className="text-xs text-muted-foreground">({item.resultCount})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.id);
                    }}
                    aria-label={`Lösche Suche: ${item.query}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </CommandItem>
              ))}
              {recentSearches.length > 0 && (
                <CommandItem
                  onSelect={clearHistory}
                  className="flex items-center gap-2 text-muted-foreground cursor-pointer justify-center mt-2"
                  role="option"
                  aria-label="Suchverlauf löschen"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-xs">Verlauf löschen</span>
                </CommandItem>
              )}
            </CommandGroup>
          )}
          
          {/* Empty recent searches state */}
          {!query && recentSearches.length === 0 && (
            <CommandGroup heading="Zuletzt gesucht">
              <CommandItem className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Ihr Suchverlauf wird hier angezeigt</span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchBox;