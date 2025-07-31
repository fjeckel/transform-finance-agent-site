import { useState, useEffect } from 'react';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultCount: number;
  type: 'episode' | 'pdf' | 'general';
}

const SEARCH_HISTORY_KEY = 'ft-search-history';
const MAX_HISTORY_ITEMS = 10;

export const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, []);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }, [history]);

  const addToHistory = (query: string, resultCount: number, type: 'episode' | 'pdf' | 'general' = 'general') => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query: query.trim(),
      timestamp: Date.now(),
      resultCount,
      type,
    };

    setHistory(prev => {
      // Remove any existing item with the same query
      const filtered = prev.filter(item => item.query.toLowerCase() !== query.toLowerCase());
      
      // Add new item at the beginning and limit to MAX_HISTORY_ITEMS
      return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const getRecentSearches = (limit: number = 5) => {
    return history.slice(0, limit);
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getRecentSearches,
  };
};