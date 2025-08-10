import { useState, useEffect, useCallback, useRef } from 'react';
import { ConversationService } from '@/services/conversation/conversationService';
import { RealtimeService } from '@/services/conversation/realtimeService';
import { CacheService } from '@/services/conversation/cacheService';
import type {
  ConversationListItem,
  ConversationFilters,
  ConversationListResponse,
  UseConversationListOptions
} from '@/types/conversation';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing conversation lists with real-time updates
 */
export function useConversationList(options: UseConversationListOptions = {}) {
  const {
    filters = {},
    limit = 20,
    realTimeUpdates = true
  } = options;

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const conversationService = useRef(ConversationService.getInstance());
  const realtimeService = useRef(RealtimeService.getInstance());
  const cacheService = useRef(CacheService.getInstance());
  const subscriptionId = useRef<string | null>(null);
  const userId = useRef<string | null>(null);
  
  // Get user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      userId.current = user?.id || null;
    };
    getCurrentUser();
  }, []);

  /**
   * Load conversations from cache or server
   */
  const loadConversations = useCallback(async (
    offset = 0, 
    append = false,
    useCache = true
  ) => {
    if (!userId.current) return;
    
    try {
      if (!append) {
        setIsLoading(true);
        setError(null);
      }

      // Try cache first
      if (useCache && offset === 0) {
        const cached = cacheService.current.getCachedConversationList(userId.current, filters);
        if (cached) {
          setConversations(cached);
          setIsLoading(false);
          return;
        }
      }

      const response: ConversationListResponse = await conversationService.current.getConversationList({
        limit,
        offset,
        filters
      });

      if (append) {
        setConversations(prev => [...prev, ...response.conversations]);
      } else {
        setConversations(response.conversations);
        
        // Cache the initial load
        if (offset === 0 && response.conversations.length > 0) {
          cacheService.current.cacheConversationList(
            userId.current,
            response.conversations,
            filters,
            { priority: 'high' }
          );
        }
      }

      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);

    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err instanceof Error ? err : new Error('Failed to load conversations'));
    } finally {
      setIsLoading(false);
    }
  }, [filters, limit]);

  /**
   * Load more conversations (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoading) return;
    
    const offset = parseInt(nextCursor);
    await loadConversations(offset, true, false);
  }, [hasMore, nextCursor, isLoading, loadConversations]);

  /**
   * Refresh conversation list
   */
  const refresh = useCallback(async () => {
    if (!userId.current) return;
    
    setIsRefreshing(true);
    
    // Clear cache to force fresh data
    cacheService.current.invalidateUserCaches(userId.current);
    
    try {
      await loadConversations(0, false, false);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadConversations]);

  /**
   * Pin/unpin conversation
   */
  const togglePin = useCallback(async (conversationId: string, pinned: boolean) => {
    try {
      await conversationService.current.updateConversation(conversationId, {
        isPinned: pinned
      });

      // Optimistically update UI
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, isPinned: pinned }
            : conv
        )
      );

      // Invalidate cache
      if (userId.current) {
        cacheService.current.invalidateUserCaches(userId.current);
      }
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      setError(err instanceof Error ? err : new Error('Failed to update conversation'));
    }
  }, []);

  /**
   * Archive conversation
   */
  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      await conversationService.current.updateConversation(conversationId, {
        isArchived: true
      });

      // Remove from UI
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));

      // Invalidate cache
      if (userId.current) {
        cacheService.current.invalidateUserCaches(userId.current);
      }
    } catch (err) {
      console.error('Failed to archive conversation:', err);
      setError(err instanceof Error ? err : new Error('Failed to archive conversation'));
    }
  }, []);

  /**
   * Delete conversation
   */
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await conversationService.current.deleteConversation(conversationId);

      // Remove from UI
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));

      // Invalidate cache
      if (userId.current) {
        cacheService.current.invalidateUserCaches(userId.current);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete conversation'));
    }
  }, []);

  /**
   * Set up real-time subscription
   */
  useEffect(() => {
    if (!realTimeUpdates || !userId.current) return;

    const setupRealTime = async () => {
      try {
        subscriptionId.current = await realtimeService.current.subscribeToUserConversations(
          userId.current!,
          {
            onConversationUpdated: (updatedConversation) => {
              setConversations(prev => {
                const index = prev.findIndex(conv => conv.id === updatedConversation.id);
                if (index !== -1) {
                  // Update existing conversation
                  const newConversations = [...prev];
                  newConversations[index] = {
                    ...newConversations[index],
                    title: updatedConversation.title || newConversations[index].title,
                    isPinned: updatedConversation.isPinned ?? newConversations[index].isPinned,
                    messageCount: updatedConversation.messageCount || newConversations[index].messageCount,
                    timestamp: updatedConversation.lastMessageAt || newConversations[index].timestamp
                  };
                  return newConversations;
                } else {
                  // New conversation - refresh list
                  refresh();
                  return prev;
                }
              });
            },
            onConnectionChange: (status) => {
              if (status === 'open' && conversations.length === 0) {
                // Reconnected - reload data
                loadConversations();
              }
            },
            onError: (err) => {
              console.error('Real-time subscription error:', err);
              setError(err);
            }
          }
        );
      } catch (err) {
        console.error('Failed to set up real-time subscription:', err);
      }
    };

    setupRealTime();

    return () => {
      if (subscriptionId.current) {
        realtimeService.current.unsubscribe(subscriptionId.current);
        subscriptionId.current = null;
      }
    };
  }, [realTimeUpdates, conversations.length, refresh, loadConversations]);

  /**
   * Initial load
   */
  useEffect(() => {
    if (userId.current) {
      loadConversations();
    }
  }, [loadConversations]);

  /**
   * Reload when filters change
   */
  useEffect(() => {
    if (userId.current) {
      setConversations([]);
      loadConversations();
    }
  }, [filters.type, filters.status, filters.timeRange, filters.folderId, filters.hasResults]);

  return {
    // Data
    conversations,
    
    // Loading states
    isLoading,
    isRefreshing,
    error,
    
    // Pagination
    hasMore,
    loadMore,
    
    // Actions
    refresh,
    togglePin,
    archiveConversation,
    deleteConversation,
    
    // Cache utilities
    clearCache: useCallback(() => {
      if (userId.current) {
        cacheService.current.invalidateUserCaches(userId.current);
      }
    }, []),
    
    // Stats
    stats: {
      total: conversations.length,
      pinned: conversations.filter(c => c.isPinned).length,
      active: conversations.filter(c => c.status === 'active').length
    }
  };
}