import React, { useState, useEffect } from 'react';
import { Search, X, Clock, Headphones, FileText } from 'lucide-react';
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

export const SearchBox: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { episodes } = useEpisodes();
  const { pdfs } = usePdfs();

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filter episodes and PDFs based on search query
  const filteredEpisodes = episodes.filter(episode =>
    episode.title?.toLowerCase().includes(query.toLowerCase()) ||
    episode.description?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const filteredPdfs = pdfs.filter(pdf =>
    pdf.title?.toLowerCase().includes(query.toLowerCase()) ||
    pdf.description?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const handleSelect = (type: string, id: string, slug?: string) => {
    setOpen(false);
    setQuery('');
    
    if (type === 'episode') {
      navigate(`/episode/${slug}`);
    } else if (type === 'pdf') {
      navigate(`/report/${id}`);
    } else if (type === 'route') {
      navigate(id);
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative h-9 w-full justify-start rounded-md bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-56"
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Suchen...</span>
        <span className="inline-flex lg:hidden">Suchen</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Episoden, PDFs oder Inhalte suchen..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
          
          {/* Quick Actions */}
          {!query && (
            <CommandGroup heading="Schnellzugriff">
              <CommandItem
                onSelect={() => handleSelect('route', '/episodes')}
                className="flex items-center gap-2"
              >
                <Headphones className="h-4 w-4" />
                Alle Episoden
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect('route', '/episodes?tab=memos')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                CFO Memos
              </CommandItem>
            </CommandGroup>
          )}

          {/* Episodes Results */}
          {filteredEpisodes.length > 0 && (
            <CommandGroup heading="Podcast Episoden">
              {filteredEpisodes.map((episode) => (
                <CommandItem
                  key={episode.id}
                  onSelect={() => handleSelect('episode', episode.id, episode.slug)}
                  className="flex items-start gap-3 p-3"
                >
                  <Headphones className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium line-clamp-1">{episode.title}</span>
                    <span className="text-xs text-muted-foreground">
                      S{episode.season}E{episode.episode_number}
                      {episode.duration && ` • ${episode.duration}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* PDFs Results */}
          {filteredPdfs.length > 0 && (
            <CommandGroup heading="CFO Memos & Reports">
              {filteredPdfs.map((pdf) => (
                <CommandItem
                  key={pdf.id}
                  onSelect={() => handleSelect('pdf', pdf.id)}
                  className="flex items-start gap-3 p-3"
                >
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium line-clamp-1">{pdf.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {pdf.is_premium ? 'Premium' : 'Kostenlos'}
                      {pdf.price && ` • €${pdf.price}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Recent Searches */}
          {!query && (
            <CommandGroup heading="Zuletzt gesucht">
              <CommandItem className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Ihre Suchverlauf wird hier angezeigt</span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchBox;