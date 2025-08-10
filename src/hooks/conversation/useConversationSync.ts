import { useEffect, useCallback, useRef, useState } from 'react';
import { RealtimeService } from '@/services/conversation/realtimeService';
import type {
  UseConversationSyncOptions,
  ConversationMessage,
  ConversationStatus
} from '@/types/conversation';

/**
 * Hook for real-time conversation synchronization
 * Provides presence, typing indicators, and live updates
 */
export function useConversationSync(options: UseConversationSyncOptions) {
  const {
    conversationId,
    autoConnect = true,
    onMessageReceived,
    onStatusChanged
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('closed');
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const realtimeService = useRef(RealtimeService.getInstance());
  const subscriptionId = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Connect to real-time updates
   */
  const connect = useCallback(async () => {
    if (!conversationId || subscriptionId.current) return;

    try {
      setConnectionStatus('connecting');
      setError(null);

      subscriptionId.current = await realtimeService.current.subscribeToConversation(
        conversationId,
        {
          onMessageAdded: (message: ConversationMessage) => {
            onMessageReceived?.(message);
          },
          onMessageUpdated: (message: ConversationMessage) => {
            // Handle message updates if needed
          },
          onConversationUpdated: (conversation) => {
            // Handle conversation status changes
            if (conversation.status) {
              onStatusChanged?.(conversation.status);
            }
          },
          onUserPresence: (users) => {
            setOnlineUsers(users);
            
            // Extract typing users
            const typing = users
              .filter(user => user.status === 'typing')
              .map(user => user.userId);
            setTypingUsers(typing);
          },
          onConnectionChange: (status) => {
            setConnectionStatus(status);
            setIsConnected(status === 'open');
          },
          onError: (err) => {
            console.error('Real-time sync error:', err);
            setError(err);
          }
        },
        {
          enablePresence: true,
          conversationId
        }
      );

    } catch (err) {
      console.error('Failed to connect to real-time updates:', err);
      setError(err instanceof Error ? err : new Error('Connection failed'));
      setConnectionStatus('error');
    }
  }, [conversationId, onMessageReceived, onStatusChanged]);

  /**
   * Disconnect from real-time updates
   */
  const disconnect = useCallback(async () => {
    if (subscriptionId.current) {
      await realtimeService.current.unsubscribe(subscriptionId.current);
      subscriptionId.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('closed');
    setOnlineUsers([]);
    setTypingUsers([]);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  /**
   * Send typing indicator
   */
  const startTyping = useCallback(async () => {
    if (!conversationId || !isConnected) return;

    try {
      await realtimeService.current.sendTypingIndicator(conversationId, true);
      
      // Auto-stop typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
      
    } catch (err) {
      console.error('Failed to send typing indicator:', err);
    }
  }, [conversationId, isConnected]);

  /**
   * Stop typing indicator
   */
  const stopTyping = useCallback(async () => {
    if (!conversationId || !isConnected) return;

    try {
      await realtimeService.current.sendTypingIndicator(conversationId, false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (err) {
      console.error('Failed to stop typing indicator:', err);
    }
  }, [conversationId, isConnected]);

  /**
   * Update presence status
   */
  const updateStatus = useCallback(async (status: 'online' | 'away') => {
    if (!conversationId || !isConnected) return;

    try {
      await realtimeService.current.updatePresence(conversationId, status);
    } catch (err) {
      console.error('Failed to update presence status:', err);
    }
  }, [conversationId, isConnected]);

  /**
   * Reconnect with exponential backoff
   */
  const reconnect = useCallback(async () => {
    await disconnect();
    
    // Wait a bit before reconnecting
    setTimeout(() => {
      if (autoConnect && conversationId) {
        connect();
      }
    }, 1000);
  }, [disconnect, connect, autoConnect, conversationId]);

  /**
   * Auto-connect on mount and conversation change
   */
  useEffect(() => {
    if (autoConnect && conversationId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, conversationId, connect, disconnect]);

  /**
   * Handle visibility changes to update presence
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateStatus('away');
      } else {
        updateStatus('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateStatus]);

  /**
   * Handle page beforeunload to clean up presence
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isConnected) {
        // Send away status before leaving
        updateStatus('away');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isConnected, updateStatus]);

  /**
   * Auto-retry connection on error
   */
  useEffect(() => {
    if (connectionStatus === 'error' && autoConnect) {
      const retryTimeout = setTimeout(() => {
        reconnect();
      }, 5000); // Retry after 5 seconds

      return () => clearTimeout(retryTimeout);
    }
  }, [connectionStatus, autoConnect, reconnect]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    error,

    // Presence data
    onlineUsers,
    typingUsers,
    
    // Connection control
    connect,
    disconnect,
    reconnect,

    // Presence actions
    startTyping,
    stopTyping,
    updateStatus,

    // Utility functions
    isUserOnline: (userId: string) => onlineUsers.some(user => user.userId === userId),
    isUserTyping: (userId: string) => typingUsers.includes(userId),
    getOnlineCount: () => onlineUsers.length,
    getTypingCount: () => typingUsers.length,

    // Connection stats
    stats: {
      connected: isConnected,
      onlineUsers: onlineUsers.length,
      typingUsers: typingUsers.length,
      connectionUptime: connectionStatus === 'open' ? Date.now() : 0 // Could track actual uptime
    }
  };
}