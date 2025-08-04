import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearchHistory } from './useSearchHistory';

export interface UseGlobalSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => void;
  isSearching: boolean;
  searchHistory: ReturnType<typeof useSearchHistory>;
}

export const useGlobalSearch = (): UseGlobalSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchHistory = useSearchHistory();

  // Initialize search from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam && searchParam !== searchQuery) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchQuery('');
      return;
    }

    setIsSearching(true);
    setSearchQuery(query);

    // Determine search context and navigate accordingly
    const currentPath = location.pathname;
    
    if (currentPath.startsWith('/insights')) {
      // Already on insights page, just update URL
      const params = new URLSearchParams(location.search);
      if (query) {
        params.set('search', query);
      } else {
        params.delete('search');
      }
      navigate(`${currentPath}?${params.toString()}`, { replace: true });
    } else if (currentPath.startsWith('/episodes')) {
      // Already on episodes page, just update URL
      const params = new URLSearchParams(location.search);
      if (query) {
        params.set('search', query);
      } else {
        params.delete('search');
      }
      navigate(`${currentPath}?${params.toString()}`, { replace: true });
    } else {
      // Navigate to episodes page (default search destination)
      navigate(`/episodes?search=${encodeURIComponent(query)}`);
    }

    // Add to search history
    searchHistory.addToHistory(query, 0, 'general');
    
    setTimeout(() => setIsSearching(false), 300);
  };

  return {
    searchQuery,
    setSearchQuery,
    performSearch,
    isSearching,
    searchHistory,
  };
};