import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

interface SearchBoxProps {
  mobile?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ 
  onSearch, 
  placeholder = "Search episodes, insights...",
  className = "",
  debounceMs = 300
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Call onSearch when debounced query changes
  useEffect(() => {
    if (onSearch && debouncedQuery !== query) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  const handleInputChange = (value: string) => {
    setQuery(value);
  };

  const handleClearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
    onSearch?.('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      // Navigate to search results - check current page and navigate accordingly
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/insights')) {
        // Already on insights page, just trigger search
        onSearch?.(query);
      } else if (currentPath.startsWith('/episodes')) {
        // Already on episodes page, just trigger search
        onSearch?.(query);
      } else {
        // Navigate to episodes page with search
        navigate(`/episodes?search=${encodeURIComponent(query)}`);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-10 pr-10"
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
  );
};