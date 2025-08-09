import { useState, useCallback, useRef, useEffect } from 'react';
import { ConversationService } from '@/services/conversation/conversationService';
import { CacheService } from '@/services/conversation/cacheService';
import type {
  ConversationSearchResult,
  ConversationSearchResponse,
  ConversationFilters
} from '@/types/conversation';
import { supabase } from '@/integrations/supabase/client';

interface UseConversationSearchOptions {
  debounceMs?: number;
  maxResults?: number;
  enableCache?: boolean;
  minQueryLength?: number;
}

/**
 * Hook for searching conversations and messages with debouncing and caching
 */
export function useConversationSearch(options: UseConversationSearchOptions = {}) {
  const {
    debounceMs = 300,
    maxResults = 50,
    enableCache = true,
    minQueryLength = 2
  } = options;

  const [results, setResults] = useState<ConversationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [searchTime, setSearchTime] = useState(0);

  const conversationService = useRef(ConversationService.getInstance());
  const cacheService = useRef(CacheService.getInstance());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchIdRef = useRef(0);

  /**
   * Perform search with optional filters
   */
  const performSearch = useCallback(async (
    searchQuery: string,
    filters: ConversationFilters = {}
  ): Promise<ConversationSearchResult[]> => {
    if (searchQuery.length < minQueryLength) {
      return [];
    }

    const searchId = ++searchIdRef.current;
    const startTime = Date.now();

    try {
      // Cancel previous search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      // Check cache first
      if (enableCache) {
        const cached = cacheService.current.getCachedSearchResults(searchQuery);
        if (cached) {
          // Ensure this search is still current
          if (searchId === searchIdRef.current) {
            setSearchTime(Date.now() - startTime);
            return cached;
          }
          return [];
        }
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Perform database search
      const searchResults = await searchConversationsAndMessages(
        user.user.id,
        searchQuery,
        filters,
        maxResults,
        abortControllerRef.current.signal
      );

      // Ensure this search is still current
      if (searchId !== searchIdRef.current) {
        return [];
      }

      // Cache results
      if (enableCache && searchResults.length > 0) {
        cacheService.current.cacheSearchResults(searchQuery, searchResults, {
          ttl: 10 * 60 * 1000, // 10 minutes
          priority: 'low'
        });
      }

      setSearchTime(Date.now() - startTime);
      return searchResults;

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Search was aborted, ignore
        return [];
      }
      throw err;
    }
  }, [minQueryLength, enableCache, maxResults]);

  /**
   * Search with debouncing
   */
  const search = useCallback((
    searchQuery: string, 
    filters: ConversationFilters = {}
  ) => {
    setQuery(searchQuery);
    setError(null);

    // Clear previous debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Clear results if query is too short
    if (searchQuery.length < minQueryLength) {
      setResults([]);
      setTotalCount(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Debounce the search
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const searchResults = await performSearch(searchQuery, filters);
        setResults(searchResults);
        setTotalCount(searchResults.length);
      } catch (err) {
        console.error('Search failed:', err);
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
        setTotalCount(0);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);
  }, [performSearch, debounceMs, minQueryLength]);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setTotalCount(0);
    setError(null);
    setIsSearching(false);
    
    // Cancel any pending search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Get search suggestions based on partial query
   */
  const getSuggestions = useCallback(async (partialQuery: string): Promise<string[]> => {
    if (partialQuery.length < 2) return [];

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      // Get recent searches and conversation titles for suggestions
      const { data: conversations, error } = await supabase
        .from('research_conversations')
        .select('title')
        .eq('user_id', user.user.id)
        .ilike('title', `%${partialQuery}%`)
        .limit(10);

      if (error) throw error;

      return conversations?.map(c => c.title) || [];
    } catch (err) {
      console.error('Failed to get suggestions:', err);
      return [];
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Search state
    results,
    isSearching,
    error,
    query,
    totalCount,
    searchTime,

    // Actions
    search,
    clearSearch,
    getSuggestions,

    // Utilities
    hasResults: results.length > 0,
    isEmpty: query.length === 0,
    isValidQuery: query.length >= minQueryLength,

    // Stats
    stats: {
      resultCount: results.length,
      searchTime,
      queryLength: query.length,
      averageRelevance: results.length > 0 
        ? results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length 
        : 0
    }
  };
}

/**
 * Search conversations and messages in the database
 */
async function searchConversationsAndMessages(
  userId: string,
  query: string,
  filters: ConversationFilters,
  limit: number,
  signal?: AbortSignal
): Promise<ConversationSearchResult[]> {
  const results: ConversationSearchResult[] = [];

  // Search conversations by title and description
  const conversationQuery = supabase
    .from('research_conversations')
    .select(`
      *,
      folder:conversation_folders(id, name, color)
    `)
    .eq('user_id', userId)
    .eq('is_archived', false);

  // Add title search
  conversationQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);

  // Apply filters
  if (filters.type) {
    conversationQuery.eq('conversation_type', filters.type);
  }
  if (filters.folderId) {
    conversationQuery.eq('folder_id', filters.folderId);
  }

  const { data: conversations, error: convError } = await conversationQuery.limit(limit);

  if (signal?.aborted) throw new Error('Search aborted');
  if (convError) throw convError;

  // Search messages content
  const messageQuery = supabase
    .from('conversation_messages')
    .select(`
      *,
      conversation:research_conversations!inner(
        id, title, user_id, is_archived
      )
    `)
    .eq('conversation.user_id', userId)
    .eq('conversation.is_archived', false)
    .ilike('content->>text', `%${query}%`);

  const { data: messages, error: msgError } = await messageQuery.limit(limit);

  if (signal?.aborted) throw new Error('Search aborted');
  if (msgError) throw msgError;

  // Process conversation results
  for (const conv of conversations || []) {
    if (signal?.aborted) throw new Error('Search aborted');

    const relevanceScore = calculateRelevanceScore(query, conv.title, conv.description);
    
    results.push({
      conversation: {
        id: conv.id,
        userId: conv.user_id,
        sessionId: conv.session_id,
        title: conv.title,
        description: conv.description,
        messageCount: conv.message_count,
        lastMessageAt: conv.last_message_at ? new Date(conv.last_message_at) : undefined,
        conversationType: conv.conversation_type,
        isPinned: conv.is_pinned,
        isArchived: conv.is_archived,
        folder: conv.folder,
        folderId: conv.folder_id,
        isShared: conv.is_shared,
        shareToken: conv.share_token,
        shareExpiresAt: conv.share_expires_at ? new Date(conv.share_expires_at) : undefined,
        contextMetadata: conv.context_metadata || {},
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at)
      },
      matchingMessages: [],
      relevanceScore
    });
  }

  // Process message results and group by conversation
  const messagesByConversation = new Map<string, any[]>();
  
  for (const msg of messages || []) {
    if (signal?.aborted) throw new Error('Search aborted');

    const convId = msg.conversation.id;
    if (!messagesByConversation.has(convId)) {
      messagesByConversation.set(convId, []);
    }
    messagesByConversation.get(convId)!.push({
      id: msg.id,
      conversationId: msg.conversation_id,
      messageUlid: msg.message_ulid,
      threadId: msg.thread_id,
      parentMessageId: msg.parent_message_id,
      role: msg.role,
      content: msg.content,
      aiProvider: msg.ai_provider,
      modelName: msg.model_name,
      promptTokens: msg.prompt_tokens || 0,
      completionTokens: msg.completion_tokens || 0,
      totalTokens: msg.total_tokens || 0,
      costUsd: parseFloat(msg.cost_usd?.toString() || '0'),
      processingTimeMs: msg.processing_time_ms || 0,
      status: msg.status,
      researchStep: msg.research_step,
      wizardStep: msg.wizard_step,
      userRating: msg.user_rating,
      userFeedback: msg.user_feedback,
      reactions: [],
      editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
      editCount: msg.edit_count || 0,
      originalContent: msg.original_content,
      createdAt: new Date(msg.created_at)
    });
  }

  // Add message matches to existing conversation results or create new ones
  for (const [convId, matchingMessages] of messagesByConversation) {
    if (signal?.aborted) throw new Error('Search aborted');

    const existingResult = results.find(r => r.conversation.id === convId);
    if (existingResult) {
      existingResult.matchingMessages = matchingMessages;
      existingResult.relevanceScore = Math.max(
        existingResult.relevanceScore,
        calculateMessageRelevanceScore(query, matchingMessages)
      );
    } else {
      // Create new result for conversations only found through messages
      const firstMessage = matchingMessages[0];
      const conv = firstMessage.conversation;
      
      results.push({
        conversation: {
          id: conv.id,
          userId: conv.user_id,
          title: conv.title,
          description: '',
          messageCount: 0,
          conversationType: 'chat',
          isPinned: false,
          isArchived: false,
          isShared: false,
          contextMetadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        } as any, // Simplified for message-only matches
        matchingMessages,
        relevanceScore: calculateMessageRelevanceScore(query, matchingMessages)
      });
    }
  }

  // Sort by relevance score
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return results.slice(0, limit);
}

/**
 * Calculate relevance score for conversation title/description match
 */
function calculateRelevanceScore(query: string, title: string, description?: string): number {
  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();
  const descLower = (description || '').toLowerCase();

  let score = 0;

  // Exact title match
  if (titleLower === queryLower) score += 10;
  // Title starts with query
  else if (titleLower.startsWith(queryLower)) score += 8;
  // Title contains query
  else if (titleLower.includes(queryLower)) score += 5;

  // Description matches
  if (descLower.includes(queryLower)) score += 2;

  // Boost for shorter titles (more specific)
  if (title.length < 50) score += 1;

  return Math.max(score, 0.1); // Minimum score
}

/**
 * Calculate relevance score for message matches
 */
function calculateMessageRelevanceScore(query: string, messages: any[]): number {
  const queryLower = query.toLowerCase();
  let maxScore = 0;

  for (const msg of messages) {
    const content = (msg.content?.text || '').toLowerCase();
    let score = 0;

    // Count occurrences
    const occurrences = (content.match(new RegExp(queryLower, 'g')) || []).length;
    score += occurrences * 2;

    // Boost for exact phrase matches
    if (content.includes(queryLower)) score += 3;

    // Boost for user messages (more intentional)
    if (msg.role === 'user') score += 1;

    maxScore = Math.max(maxScore, score);
  }

  return Math.max(maxScore, 0.1); // Minimum score
}