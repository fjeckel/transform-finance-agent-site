import { useState, useEffect, useCallback, useRef } from 'react';
import { ConversationService } from '@/services/conversation/conversationService';
import { MessageService } from '@/services/conversation/messageService';
import { RealtimeService } from '@/services/conversation/realtimeService';
import { CacheService } from '@/services/conversation/cacheService';
import type {
  ConversationMessage,
  ConversationArtifact,
  ResearchConversation,
  SendMessageInput,
  MessageContent,
  ReactionType,
  OptimisticMessage,
  UseConversationHistoryOptions
} from '@/types/conversation';
import { AIProvider } from '@/types/research';

/**
 * Hook for managing conversation history and messages with real-time updates
 */
export function useConversationHistory(options: UseConversationHistoryOptions) {
  const {
    conversationId,
    limit = 50,
    loadArtifacts = true,
    realTimeUpdates = true
  } = options;

  // State
  const [conversation, setConversation] = useState<ResearchConversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [artifacts, setArtifacts] = useState<ConversationArtifact[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  // Services
  const conversationService = useRef(ConversationService.getInstance());
  const messageService = useRef(MessageService.getInstance());
  const realtimeService = useRef(RealtimeService.getInstance());
  const cacheService = useRef(CacheService.getInstance());
  
  // Refs
  const subscriptionId = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Load conversation history
   */
  const loadHistory = useCallback(async (useCache = true, cursor?: string, append = false) => {
    if (!conversationId) return;

    try {
      if (!append) {
        setIsLoading(true);
        setError(null);
      }

      // Try cache first for initial load
      if (useCache && !cursor) {
        const cachedMessages = cacheService.current.getCachedMessages(conversationId);
        const cachedConversation = cacheService.current.getCachedConversation(conversationId);
        
        if (cachedMessages && cachedConversation) {
          setMessages(cachedMessages);
          setConversation(cachedConversation);
          setIsLoading(false);
          return;
        }
      }

      const response = await conversationService.current.getConversationHistory(
        conversationId,
        { limit, cursor, loadArtifacts }
      );

      if (append) {
        setMessages(prev => [...prev, ...response.messages]);
      } else {
        setMessages(response.messages);
        setConversation(response.conversation);
        setArtifacts(response.artifacts);

        // Cache the data
        cacheService.current.cacheConversation(response.conversation, { priority: 'high' });
        cacheService.current.cacheMessages(conversationId, response.messages, { priority: 'high' });
      }

      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);

    } catch (err) {
      console.error('Failed to load conversation history:', err);
      setError(err instanceof Error ? err : new Error('Failed to load conversation history'));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, limit, loadArtifacts]);

  /**
   * Load more messages (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoading) return;
    await loadHistory(false, nextCursor, true);
  }, [hasMore, nextCursor, isLoading, loadHistory]);

  /**
   * Send message with AI response
   */
  const sendMessage = useCallback(async (
    content: MessageContent,
    aiProvider?: AIProvider,
    researchStep?: string,
    wizardStep?: number
  ) => {
    if (!conversationId || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const input: SendMessageInput = {
        conversationId,
        content,
        aiProvider,
        researchStep,
        wizardStep
      };

      // Get optimistic messages for UI
      const optimistic = messageService.current.getOptimisticMessages(conversationId);
      setOptimisticMessages(optimistic);

      const userMessage = await messageService.current.sendMessage(input);

      // Update messages with real message
      setMessages(prev => {
        // Remove any optimistic messages and add real one
        const filtered = prev.filter(m => !optimistic.some(opt => opt.id === m.id));
        return [...filtered, userMessage].sort((a, b) => a.messageUlid.localeCompare(b.messageUlid));
      });

      // Clear optimistic messages
      setOptimisticMessages([]);

      // Update cache
      cacheService.current.addOptimisticMessage(conversationId, userMessage);

      // Scroll to bottom
      scrollToBottom();

    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      
      // Keep optimistic messages with error state
      const optimistic = messageService.current.getOptimisticMessages(conversationId);
      setOptimisticMessages(optimistic);
    } finally {
      setIsSending(false);
    }
  }, [conversationId, isSending]);

  /**
   * Edit message
   */
  const editMessage = useCallback(async (messageId: string, newContent: MessageContent) => {
    try {
      const updatedMessage = await messageService.current.editMessage(messageId, newContent);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        )
      );

      // Update cache
      cacheService.current.updateMessageInCache(conversationId, updatedMessage);

    } catch (err) {
      console.error('Failed to edit message:', err);
      setError(err instanceof Error ? err : new Error('Failed to edit message'));
    }
  }, [conversationId]);

  /**
   * Add reaction to message
   */
  const addReaction = useCallback(async (messageId: string, reactionType: ReactionType) => {
    try {
      const reaction = await messageService.current.addReaction(messageId, reactionType);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
            : msg
        )
      );

    } catch (err) {
      console.error('Failed to add reaction:', err);
      setError(err instanceof Error ? err : new Error('Failed to add reaction'));
    }
  }, []);

  /**
   * Remove reaction from message
   */
  const removeReaction = useCallback(async (messageId: string, reactionType: ReactionType) => {
    try {
      await messageService.current.removeReaction(messageId, reactionType);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                reactions: (msg.reactions || []).filter(r => r.reactionType !== reactionType)
              }
            : msg
        )
      );

    } catch (err) {
      console.error('Failed to remove reaction:', err);
      setError(err instanceof Error ? err : new Error('Failed to remove reaction'));
    }
  }, []);

  /**
   * Retry failed message
   */
  const retryMessage = useCallback(async (messageId: string) => {
    try {
      const retriedMessage = await messageService.current.retryMessage(messageId);
      
      // Update optimistic messages
      const optimistic = messageService.current.getOptimisticMessages(conversationId);
      setOptimisticMessages(optimistic);

    } catch (err) {
      console.error('Failed to retry message:', err);
      setError(err instanceof Error ? err : new Error('Failed to retry message'));
    }
  }, [conversationId]);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto' 
    });
  }, []);

  /**
   * Regenerate AI response
   */
  const regenerateResponse = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.role !== 'user') return;

    try {
      // Find the AI provider from the next message if available
      const nextMessage = messages[messages.indexOf(message) + 1];
      const aiProvider = nextMessage?.aiProvider || 'claude';

      await messageService.current.generateAIResponse(message, aiProvider);
      
      // Refresh messages to show new response
      await loadHistory(false);

    } catch (err) {
      console.error('Failed to regenerate response:', err);
      setError(err instanceof Error ? err : new Error('Failed to regenerate response'));
    }
  }, [messages, loadHistory]);

  /**
   * Set up real-time subscription
   */
  useEffect(() => {
    if (!realTimeUpdates || !conversationId) return;

    const setupRealTime = async () => {
      try {
        subscriptionId.current = await realtimeService.current.subscribeToConversation(
          conversationId,
          {
            onMessageAdded: (message) => {
              setMessages(prev => {
                // Avoid duplicates and maintain order
                if (prev.some(m => m.id === message.id)) return prev;
                const newMessages = [...prev, message];
                return newMessages.sort((a, b) => a.messageUlid.localeCompare(b.messageUlid));
              });
              
              cacheService.current.addOptimisticMessage(conversationId, message);
              scrollToBottom();
            },
            onMessageUpdated: (message) => {
              setMessages(prev => 
                prev.map(m => m.id === message.id ? message : m)
              );
              
              cacheService.current.updateMessageInCache(conversationId, message);
            },
            onMessageDeleted: (messageId) => {
              setMessages(prev => prev.filter(m => m.id !== messageId));
              cacheService.current.removeMessageFromCache(conversationId, messageId);
            },
            onConversationUpdated: (updatedConversation) => {
              setConversation(prev => 
                prev ? { ...prev, ...updatedConversation } : prev
              );
            },
            onConnectionChange: (status) => {
              if (status === 'open' && messages.length === 0) {
                // Reconnected - reload data
                loadHistory(false);
              }
            },
            onError: (err) => {
              console.error('Real-time subscription error:', err);
              setError(err);
            }
          },
          { enablePresence: true }
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
  }, [conversationId, realTimeUpdates, messages.length, loadHistory, scrollToBottom]);

  /**
   * Initial load
   */
  useEffect(() => {
    if (conversationId) {
      loadHistory();
    }
  }, [conversationId, loadHistory]);

  /**
   * Clean up optimistic messages on unmount
   */
  useEffect(() => {
    return () => {
      if (conversationId) {
        messageService.current.clearOptimisticMessages(conversationId);
      }
    };
  }, [conversationId]);

  /**
   * Merge real messages with optimistic messages for display
   */
  const allMessages = [...messages, ...optimisticMessages]
    .sort((a, b) => a.messageUlid.localeCompare(b.messageUlid));

  return {
    // Data
    conversation,
    messages: allMessages,
    artifacts,
    
    // Loading states
    isLoading,
    isSending,
    error,
    
    // Pagination
    hasMore,
    loadMore,
    
    // Actions
    sendMessage,
    editMessage,
    addReaction,
    removeReaction,
    retryMessage,
    regenerateResponse,
    
    // UI utilities
    scrollToBottom,
    messagesEndRef,
    
    // Cache utilities
    refresh: () => loadHistory(false),
    clearCache: () => {
      cacheService.current.invalidateConversation(conversationId);
      messageService.current.clearOptimisticMessages(conversationId);
    },
    
    // Stats
    stats: {
      totalMessages: messages.length,
      totalCost: messages.reduce((sum, msg) => sum + msg.costUsd, 0),
      totalTokens: messages.reduce((sum, msg) => sum + msg.totalTokens, 0),
      averageResponseTime: messages.length > 0 
        ? messages.reduce((sum, msg) => sum + msg.processingTimeMs, 0) / messages.length 
        : 0
    }
  };
}