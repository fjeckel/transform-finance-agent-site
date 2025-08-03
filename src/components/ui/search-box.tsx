import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBoxProps {
  mobile?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ 
  onSearch, 
  placeholder = "Search...",
  className = ""
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};