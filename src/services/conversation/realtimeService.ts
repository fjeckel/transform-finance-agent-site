import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  ConversationUpdate,
  MessageUpdate,
  ConversationMessage,
  ResearchConversation
} from '@/types/conversation';

/**
 * Real-time Service for live conversation updates
 * 
 * Features:
 * - Real-time message synchronization
 * - Conversation status updates
 * - Multi-user collaboration support
 * - Connection management with auto-reconnect
 * - Event debouncing and batching
 */

export interface RealtimeSubscriptionOptions {
  conversationId?: string;
  userId?: string;
  enablePresence?: boolean;
  debounceMs?: number;
}

export interface RealtimeEventHandlers {
  onMessageAdded?: (message: ConversationMessage) => void;
  onMessageUpdated?: (message: ConversationMessage) => void;
  onMessageDeleted?: (messageId: string) => void;
  onConversationUpdated?: (conversation: Partial<ResearchConversation>) => void;
  onUserPresence?: (users: any[]) => void;
  onConnectionChange?: (status: 'connecting' | 'open' | 'closed' | 'error') => void;
  onError?: (error: Error) => void;
}

export interface PresenceState {
  userId: string;
  username?: string;
  avatar?: string;
  lastSeen: string;
  status: 'online' | 'typing' | 'away';
}

/**
 * Real-time Service Implementation
 */
export class RealtimeService {
  private static instance: RealtimeService;
  private channels = new Map<string, RealtimeChannel>();
  private eventHandlers = new Map<string, RealtimeEventHandlers>();
  private connectionStatus: 'connecting' | 'open' | 'closed' | 'error' = 'closed';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private eventQueue = new Map<string, any[]>();
  private debouncedHandlers = new Map<string, NodeJS.Timeout>();

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Subscribe to real-time updates for a conversation
   */
  async subscribeToConversation(
    conversationId: string, 
    handlers: RealtimeEventHandlers,
    options: RealtimeSubscriptionOptions = {}
  ): Promise<string> {
    const subscriptionId = `conversation_${conversationId}`;
    
    try {
      // Store event handlers
      this.eventHandlers.set(subscriptionId, handlers);
      
      // Create channel for conversation
      const channel = supabase
        .channel(subscriptionId)
        .on('postgres_changes', 
          {
            event: 'INSERT',
            schema: 'public',
            table: 'conversation_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => this.handleMessageInsert(subscriptionId, payload)
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversation_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => this.handleMessageUpdate(subscriptionId, payload)
        )
        .on('postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'conversation_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => this.handleMessageDelete(subscriptionId, payload)
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'research_conversations',
            filter: `id=eq.${conversationId}`
          },
          (payload) => this.handleConversationUpdate(subscriptionId, payload)
        );

      // Add presence tracking if enabled
      if (options.enablePresence) {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          channel.on('presence', { event: 'sync' }, () => {
            const presence = channel.presenceState();
            this.handlePresenceSync(subscriptionId, presence);
          });

          channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
            this.handlePresenceJoin(subscriptionId, newPresences);
          });

          channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            this.handlePresenceLeave(subscriptionId, leftPresences);
          });

          // Track own presence
          await channel.track({
            userId: user.user.id,
            username: user.user.user_metadata?.username || user.user.email,
            avatar: user.user.user_metadata?.avatar_url,
            lastSeen: new Date().toISOString(),
            status: 'online'
          } as PresenceState);
        }
      }

      // Subscribe to channel
      const status = await channel.subscribe((status, error) => {
        this.connectionStatus = status;
        handlers.onConnectionChange?.(status);
        
        if (error) {
          console.error('Realtime subscription error:', error);
          handlers.onError?.(new Error(error.message));
          this.handleReconnect(subscriptionId, handlers, options);
        }
      });

      this.channels.set(subscriptionId, channel);
      return subscriptionId;

    } catch (error) {
      console.error('Failed to subscribe to conversation:', error);
      handlers.onError?.(error instanceof Error ? error : new Error('Subscription failed'));
      throw error;
    }
  }

  /**
   * Subscribe to user's conversation list updates
   */
  async subscribeToUserConversations(
    userId: string,
    handlers: Pick<RealtimeEventHandlers, 'onConversationUpdated' | 'onConnectionChange' | 'onError'>
  ): Promise<string> {
    const subscriptionId = `user_conversations_${userId}`;
    
    try {
      this.eventHandlers.set(subscriptionId, handlers);

      const channel = supabase
        .channel(subscriptionId)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'research_conversations',
            filter: `user_id=eq.${userId}`
          },
          (payload) => this.handleConversationUpdate(subscriptionId, payload)
        );

      await channel.subscribe((status, error) => {
        this.connectionStatus = status;
        handlers.onConnectionChange?.(status);
        
        if (error) {
          console.error('User conversations subscription error:', error);
          handlers.onError?.(new Error(error.message));
        }
      });

      this.channels.set(subscriptionId, channel);
      return subscriptionId;

    } catch (error) {
      console.error('Failed to subscribe to user conversations:', error);
      handlers.onError?.(error instanceof Error ? error : new Error('Subscription failed'));
      throw error;
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const channel = this.channels.get(subscriptionId);
    if (channel) {
      await channel.unsubscribe();
      this.channels.delete(subscriptionId);
    }
    
    this.eventHandlers.delete(subscriptionId);
    
    // Clear any debounced handlers
    const debounced = this.debouncedHandlers.get(subscriptionId);
    if (debounced) {
      clearTimeout(debounced);
      this.debouncedHandlers.delete(subscriptionId);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    const promises = Array.from(this.channels.keys()).map(id => this.unsubscribe(id));
    await Promise.all(promises);
  }

  /**
   * Update user presence (typing status, etc.)
   */
  async updatePresence(conversationId: string, status: PresenceState['status'], metadata?: any): Promise<void> {
    const subscriptionId = `conversation_${conversationId}`;
    const channel = this.channels.get(subscriptionId);
    
    if (channel) {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await channel.track({
          userId: user.user.id,
          username: user.user.user_metadata?.username || user.user.email,
          avatar: user.user.user_metadata?.avatar_url,
          lastSeen: new Date().toISOString(),
          status,
          ...metadata
        } as PresenceState);
      }
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    await this.updatePresence(conversationId, isTyping ? 'typing' : 'online');
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): 'connecting' | 'open' | 'closed' | 'error' {
    return this.connectionStatus;
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.channels.keys());
  }

  // ===========================================
  // PRIVATE EVENT HANDLERS
  // ===========================================

  private handleMessageInsert(subscriptionId: string, payload: any): void {
    try {
      const message = this.transformMessagePayload(payload.new);
      const handlers = this.eventHandlers.get(subscriptionId);
      
      this.debounceHandler(subscriptionId, 'messageAdded', () => {
        handlers?.onMessageAdded?.(message);
      });
    } catch (error) {
      console.error('Error handling message insert:', error);
      this.eventHandlers.get(subscriptionId)?.onError?.(error instanceof Error ? error : new Error('Message insert error'));
    }
  }

  private handleMessageUpdate(subscriptionId: string, payload: any): void {
    try {
      const message = this.transformMessagePayload(payload.new);
      const handlers = this.eventHandlers.get(subscriptionId);
      
      this.debounceHandler(subscriptionId, 'messageUpdated', () => {
        handlers?.onMessageUpdated?.(message);
      });
    } catch (error) {
      console.error('Error handling message update:', error);
      this.eventHandlers.get(subscriptionId)?.onError?.(error instanceof Error ? error : new Error('Message update error'));
    }
  }

  private handleMessageDelete(subscriptionId: string, payload: any): void {
    try {
      const messageId = payload.old.id;
      const handlers = this.eventHandlers.get(subscriptionId);
      
      handlers?.onMessageDeleted?.(messageId);
    } catch (error) {
      console.error('Error handling message delete:', error);
      this.eventHandlers.get(subscriptionId)?.onError?.(error instanceof Error ? error : new Error('Message delete error'));
    }
  }

  private handleConversationUpdate(subscriptionId: string, payload: any): void {
    try {
      const conversation = this.transformConversationPayload(payload.new);
      const handlers = this.eventHandlers.get(subscriptionId);
      
      this.debounceHandler(subscriptionId, 'conversationUpdated', () => {
        handlers?.onConversationUpdated?.(conversation);
      });
    } catch (error) {
      console.error('Error handling conversation update:', error);
      this.eventHandlers.get(subscriptionId)?.onError?.(error instanceof Error ? error : new Error('Conversation update error'));
    }
  }

  private handlePresenceSync(subscriptionId: string, presence: any): void {
    try {
      const users = Object.values(presence).flat() as PresenceState[];
      const handlers = this.eventHandlers.get(subscriptionId);
      
      handlers?.onUserPresence?.(users);
    } catch (error) {
      console.error('Error handling presence sync:', error);
      this.eventHandlers.get(subscriptionId)?.onError?.(error instanceof Error ? error : new Error('Presence sync error'));
    }
  }

  private handlePresenceJoin(subscriptionId: string, newPresences: any[]): void {
    try {
      const handlers = this.eventHandlers.get(subscriptionId);
      // Could emit specific join events if needed
    } catch (error) {
      console.error('Error handling presence join:', error);
    }
  }

  private handlePresenceLeave(subscriptionId: string, leftPresences: any[]): void {
    try {
      const handlers = this.eventHandlers.get(subscriptionId);
      // Could emit specific leave events if needed
    } catch (error) {
      console.error('Error handling presence leave:', error);
    }
  }

  /**
   * Debounce event handlers to prevent excessive updates
   */
  private debounceHandler(subscriptionId: string, eventType: string, handler: () => void, delay = 100): void {
    const key = `${subscriptionId}_${eventType}`;
    
    const existing = this.debouncedHandlers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    
    const timeout = setTimeout(() => {
      handler();
      this.debouncedHandlers.delete(key);
    }, delay);
    
    this.debouncedHandlers.set(key, timeout);
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private async handleReconnect(
    subscriptionId: string, 
    handlers: RealtimeEventHandlers, 
    options: RealtimeSubscriptionOptions
  ): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      handlers.onError?.(new Error('Connection lost - max retries exceeded'));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.unsubscribe(subscriptionId);
        
        if (subscriptionId.startsWith('conversation_')) {
          const conversationId = subscriptionId.replace('conversation_', '');
          await this.subscribeToConversation(conversationId, handlers, options);
        } else if (subscriptionId.startsWith('user_conversations_')) {
          const userId = subscriptionId.replace('user_conversations_', '');
          await this.subscribeToUserConversations(userId, handlers);
        }
        
        this.reconnectAttempts = 0; // Reset on successful reconnection
        this.reconnectDelay = 1000; // Reset delay
        
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.handleReconnect(subscriptionId, handlers, options);
      }
    }, delay);
  }

  /**
   * Transform database payload to ConversationMessage
   */
  private transformMessagePayload(payload: any): ConversationMessage {
    return {
      id: payload.id,
      conversationId: payload.conversation_id,
      messageUlid: payload.message_ulid,
      threadId: payload.thread_id,
      parentMessageId: payload.parent_message_id,
      role: payload.role,
      content: payload.content,
      aiProvider: payload.ai_provider,
      modelName: payload.model_name,
      promptTokens: payload.prompt_tokens || 0,
      completionTokens: payload.completion_tokens || 0,
      totalTokens: payload.total_tokens || 0,
      costUsd: parseFloat(payload.cost_usd?.toString() || '0'),
      processingTimeMs: payload.processing_time_ms || 0,
      status: payload.status,
      researchStep: payload.research_step,
      wizardStep: payload.wizard_step,
      userRating: payload.user_rating,
      userFeedback: payload.user_feedback,
      reactions: [], // Reactions loaded separately
      editedAt: payload.edited_at ? new Date(payload.edited_at) : undefined,
      editCount: payload.edit_count || 0,
      originalContent: payload.original_content,
      createdAt: new Date(payload.created_at)
    };
  }

  /**
   * Transform database payload to conversation data
   */
  private transformConversationPayload(payload: any): Partial<ResearchConversation> {
    return {
      id: payload.id,
      title: payload.title,
      description: payload.description,
      messageCount: payload.message_count,
      lastMessageAt: payload.last_message_at ? new Date(payload.last_message_at) : undefined,
      conversationType: payload.conversation_type,
      isPinned: payload.is_pinned,
      isArchived: payload.is_archived,
      isShared: payload.is_shared,
      shareToken: payload.share_token,
      shareExpiresAt: payload.share_expires_at ? new Date(payload.share_expires_at) : undefined,
      contextMetadata: payload.context_metadata || {},
      updatedAt: new Date(payload.updated_at)
    };
  }
}