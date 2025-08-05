import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, Filter, Headphones, FileText, BookOpen, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { cn } from '@/lib/utils';

interface SearchCategory {
  key: string;
  label: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

interface EnhancedSearchProps {
  className?: string;
  placeholder?: string;
}

const searchCategories: SearchCategory[] = [
  {
    key: 'episodes',
    label: 'Alle Episoden',
    icon: Headphones,
    path: '/episodes',
    description: 'Durchsuche alle Podcast-Episoden'
  },
  {
    key: 'insights',
    label: 'Alle Insights',
    icon: BookOpen,
    path: '/insights',
    description: 'Entdecke detaillierte Finanz-Insights'
  },
  {
    key: 'memos',
    label: 'CFO Memos',
    icon: FileText,
    path: '/episodes?tab=memos',
    description: 'Kurze, prägnante CFO-Memos'
  }
];

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  className = "",
  placeholder = "Search episodes, insights..."
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { performSearch, searchHistory } = useGlobalSearch();
  
  const recentSearches = searchHistory.getRecentSearches(3);

  // Handle clicking outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = searchCategories.length + recentSearches.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < searchCategories.length) {
            // Navigate to category
            const category = searchCategories[selectedIndex];
            navigate(category.path);
          } else {
            // Use recent search
            const recentIndex = selectedIndex - searchCategories.length;
            const recentSearch = recentSearches[recentIndex];
            if (recentSearch) {
              setQuery(recentSearch.query);
              performSearch(recentSearch.query);
            }
          }
          setIsExpanded(false);
        } else if (query.trim()) {
          // Perform search with current query
          performSearch(query);
          setIsExpanded(false);
        }
        break;
      case 'Escape':
        setIsExpanded(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [selectedIndex, searchCategories, recentSearches, query, navigate, performSearch]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsExpanded(true);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleCategoryClick = (category: SearchCategory) => {
    navigate(category.path);
    setIsExpanded(false);
  };

  const handleRecentSearchClick = (searchItem: any) => {
    setQuery(searchItem.query);
    performSearch(searchItem.query);
    setIsExpanded(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-10 pr-10 transition-all duration-200",
            isExpanded ? "ring-2 ring-[#13B87B]/20 border-[#13B87B]/30" : ""
          )}
        />
        {query && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Expanded Search Panel */}
      {isExpanded && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-border/50">
          <CardContent className="p-0">
            {/* Quick Access Categories */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Schnellzugriff</span>
              </div>
              <div className="space-y-1">
                {searchCategories.map((category, index) => {
                  const Icon = category.icon;
                  const isSelected = selectedIndex === index;
                  
                  return (
                    <button
                      key={category.key}
                      onClick={() => handleCategoryClick(category)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                        isSelected 
                          ? "bg-[#13B87B]/10 text-[#13B87B]" 
                          : "hover:bg-accent text-foreground"
                      )}
                    >
                      <Icon size={18} className={isSelected ? "text-[#13B87B]" : "text-muted-foreground"} />
                      <div className="flex-1">
                        <div className="font-medium">{category.label}</div>
                        <div className="text-xs text-muted-foreground">{category.description}</div>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Letzte Suchen</span>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((searchItem, index) => {
                    const globalIndex = searchCategories.length + index;
                    const isSelected = selectedIndex === globalIndex;
                    
                    return (
                      <button
                        key={searchItem.id}
                        onClick={() => handleRecentSearchClick(searchItem)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                          isSelected 
                            ? "bg-[#13B87B]/10 text-[#13B87B]" 
                            : "hover:bg-accent text-foreground"
                        )}
                      >
                        <Search size={16} className={isSelected ? "text-[#13B87B]" : "text-muted-foreground"} />
                        <span className="flex-1 text-sm">{searchItem.query}</span>
                        <span className="text-xs text-muted-foreground">
                          {searchItem.resultCount} Ergebnisse
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search Hint */}
            <div className="p-3 bg-muted/30 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>↵ Enter zum Suchen</span>
                <span>⇅ Navigation • Esc zum Schließen</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};