import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Clock, Headphones, FileText, Loader2, Trash2 } from 'lucide-react';
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
  const navigate = useNavigate();
  const { episodes, loading: episodesLoading } = useEpisodes();
  const { pdfs, loading: pdfsLoading } = usePdfs();
  const { addToHistory, getRecentSearches, removeFromHistory, clearHistory } = useSearchHistory();
  
  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  // Debounce search query for performance
  const debouncedQuery = useDebounce(query, 300);
  
  // Loading state
  const isLoading = episodesLoading || pdfsLoading || isSearching;
  
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

  // Filter episodes and PDFs based on debounced search query
  const { filteredEpisodes, filteredPdfs } = useMemo(() => {
    if (!debouncedQuery) {
      return { filteredEpisodes: [], filteredPdfs: [] };
    }
    
    const searchTerm = debouncedQuery.toLowerCase();
    
    const episodeResults = episodes.filter(episode =>
      episode.title?.toLowerCase().includes(searchTerm) ||
      episode.description?.toLowerCase().includes(searchTerm) ||
      episode.content?.toLowerCase().includes(searchTerm)
    ).slice(0, mobile ? 8 : 5);

    const pdfResults = pdfs.filter(pdf =>
      pdf.title?.toLowerCase().includes(searchTerm) ||
      pdf.description?.toLowerCase().includes(searchTerm)
    ).slice(0, mobile ? 8 : 5);
    
    return { 
      filteredEpisodes: episodeResults, 
      filteredPdfs: pdfResults 
    };
  }, [debouncedQuery, episodes, pdfs, mobile]);

  const handleSelect = (type: string, id: string, slug?: string) => {
    // Add search to history if there was a query
    if (query.trim()) {
      const resultCount = filteredEpisodes.length + filteredPdfs.length;
      const searchType = type === 'episode' ? 'episode' : type === 'pdf' ? 'pdf' : 'general';
      addToHistory(query, resultCount, searchType);
    }
    
    setOpen(false);
    setQuery('');
    setIsSearching(false);
    
    if (type === 'episode') {
      navigate(`/episode/${slug}`);
    } else if (type === 'pdf') {
      navigate(`/report/${id}`);
    } else if (type === 'route') {
      navigate(id);
    } else if (type === 'search-history') {
      // Handle search history item selection
      setQuery(id); // id contains the search query for history items
      // Don't close the search, let user see results
    }
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
            placeholder={mobile ? "Suchen..." : "Episoden, PDFs oder Inhalte suchen..."}
            value={query}
            onValueChange={handleSearchChange}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Suchfeld"
          />
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0 opacity-50" />
          )}
        </div>
        <CommandList className={mobile ? "max-h-[60vh]" : "max-h-[300px]"}>
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
                      S{episode.season}E{episode.episode_number}
                      {episode.duration && ` • ${episode.duration}`}
                    </span>
                    {episode.description && mobile && (
                      <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {highlightSearchTerms(episode.description, debouncedQuery)}
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
                      {pdf.is_premium ? 'Premium' : 'Kostenlos'}
                      {pdf.price && ` • €${pdf.price}`}
                    </span>
                    {pdf.description && mobile && (
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