import { useState, useMemo, useCallback } from 'react';
import type { ResearchSessionSummary, SidebarFilters, SidebarSearchState } from '../types';

const defaultFilters: SidebarFilters = {
  status: 'all',
  dateRange: 'all',
  folder: 'all',
  provider: 'all',
  favorite: null,
  archived: false
};

export const useSessionSearch = (sessions: ResearchSessionSummary[]) => {
  const [searchState, setSearchState] = useState<SidebarSearchState>({
    query: '',
    filters: defaultFilters,
    sortBy: 'updated_at',
    sortOrder: 'desc'
  });

  // Update search query
  const setSearchQuery = useCallback((query: string) => {
    setSearchState(prev => ({ ...prev, query }));
  }, []);

  // Update filters
  const updateFilters = useCallback((filters: Partial<SidebarFilters>) => {
    setSearchState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters }
    }));
  }, []);

  // Update sorting
  const updateSort = useCallback((sortBy: SidebarSearchState['sortBy'], sortOrder?: 'asc' | 'desc') => {
    setSearchState(prev => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder || (prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc')
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      query: '',
      filters: defaultFilters
    }));
  }, []);

  // Get date range filter
  const getDateFilter = useCallback((dateRange: string): Date | null => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return weekAgo;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return monthAgo;
      case 'quarter':
        const quarterAgo = new Date(now);
        quarterAgo.setMonth(now.getMonth() - 3);
        return quarterAgo;
      default:
        return null;
    }
  }, []);

  // Check if session matches provider filter
  const matchesProviderFilter = useCallback((
    session: ResearchSessionSummary,
    provider: string
  ): boolean => {
    if (provider === 'all') return true;
    
    const providerUsage = session.conversation_metadata?.provider_usage || {};
    return Object.keys(providerUsage).includes(provider);
  }, []);

  // Apply all filters and search
  const filteredSessions = useMemo(() => {
    const { query, filters } = searchState;
    
    let filtered = sessions.filter(session => {
      // Text search
      const searchText = query.toLowerCase();
      const matchesSearch = !searchText || 
        session.session_title.toLowerCase().includes(searchText) ||
        session.research_type.toLowerCase().includes(searchText) ||
        (session.conversation_metadata?.tags || []).some(tag => 
          tag.toLowerCase().includes(searchText)
        );

      if (!matchesSearch) return false;

      // Status filter
      if (filters.status !== 'all' && session.status !== filters.status) {
        return false;
      }

      // Date range filter
      const dateFilter = getDateFilter(filters.dateRange);
      if (dateFilter) {
        const sessionDate = new Date(session.updated_at);
        if (sessionDate < dateFilter) return false;
      }

      // Folder filter
      if (filters.folder !== 'all') {
        if (filters.folder === 'unorganized') {
          if (session.folder_id !== null) return false;
        } else if (session.folder_id !== filters.folder) {
          return false;
        }
      }

      // Provider filter
      if (!matchesProviderFilter(session, filters.provider)) {
        return false;
      }

      // Favorite filter
      if (filters.favorite !== null) {
        const isFavorite = session.conversation_metadata?.favorite || false;
        if (isFavorite !== filters.favorite) return false;
      }

      // Archived filter
      const isArchived = session.conversation_metadata?.archived || false;
      if (isArchived !== filters.archived) return false;

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (searchState.sortBy) {
        case 'title':
          aValue = a.session_title.toLowerCase();
          bValue = b.session_title.toLowerCase();
          break;
        case 'cost':
          aValue = a.actual_cost_usd || a.estimated_cost_usd;
          bValue = b.actual_cost_usd || b.estimated_cost_usd;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'updated_at':
        default:
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
      }

      if (aValue < bValue) return searchState.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return searchState.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [sessions, searchState, getDateFilter, matchesProviderFilter]);

  // Get filter stats
  const filterStats = useMemo(() => {
    const stats = {
      total: sessions.length,
      filtered: filteredSessions.length,
      byStatus: {} as Record<string, number>,
      byFolder: {} as Record<string, number>,
      favorites: 0,
      archived: 0
    };

    sessions.forEach(session => {
      // Status stats
      stats.byStatus[session.status] = (stats.byStatus[session.status] || 0) + 1;

      // Folder stats
      const folderId = session.folder_id || 'unorganized';
      stats.byFolder[folderId] = (stats.byFolder[folderId] || 0) + 1;

      // Favorites and archived
      if (session.conversation_metadata?.favorite) stats.favorites++;
      if (session.conversation_metadata?.archived) stats.archived++;
    });

    return stats;
  }, [sessions, filteredSessions.length]);

  return {
    searchState,
    filteredSessions,
    filterStats,
    setSearchQuery,
    updateFilters,
    updateSort,
    clearFilters
  };
};