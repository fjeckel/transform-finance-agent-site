// ConversationService - Core service for managing research conversations
// Handles CRUD operations, Supabase integration, and conversation management

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import {
  ResearchConversation,
  ConversationListItem,
  ConversationFilters,
  CreateConversationInput,
  ConversationListResponse,
  ConversationHistoryResponse,
  ConversationError
} from '@/types/conversation';
import { generateUlid } from '@/lib/ulid';
import { CacheService } from './cacheService';
import { ErrorHandler } from './errorHandler';

type ConversationRow = Database['public']['Tables']['research_conversations']['Row'];
type ConversationInsert = Database['public']['Tables']['research_conversations']['Insert'];

class ConversationService {
  private cache = new CacheService('conversations', 50); // Cache up to 50 conversations
  private errorHandler = new ErrorHandler('ConversationService');

  /**
   * Create a new research conversation with initial message
   */
  async createConversation(input: CreateConversationInput): Promise<ResearchConversation> {
    try {
      // Generate conversation title if not provided
      const title = input.title || this.generateTitleFromContent(input.content.text);
      
      // Create conversation record
      const conversationData: ConversationInsert = {
        title,
        conversation_type: input.conversationType || 'research',
        session_id: input.sessionId,
        folder_id: input.folderId,
        context_metadata: {
          initialTopic: input.content.text,
          createdAt: new Date().toISOString()
        }
      };

      const { data: conversation, error: conversationError } = await supabase
        .from('research_conversations')
        .insert(conversationData)
        .select('*')
        .single();

      if (conversationError) {
        throw this.errorHandler.createError(
          'CONVERSATION_CREATE_FAILED',
          'Failed to create conversation',
          conversationError
        );
      }

      // Create initial message using the database function
      const { data: conversationId, error: messageError } = await supabase
        .rpc('create_conversation_with_message', {
          p_title: title,
          p_content: input.content,
          p_session_id: input.sessionId,
          p_conversation_type: input.conversationType || 'research'
        });

      if (messageError) {
        // Cleanup conversation if message creation failed
        await supabase
          .from('research_conversations')
          .delete()
          .eq('id', conversation.id);
        
        throw this.errorHandler.createError(
          'MESSAGE_CREATE_FAILED',
          'Failed to create initial message',
          messageError
        );
      }

      // Fetch the complete conversation with updated metadata
      const createdConversation = await this.getConversationById(conversationId);
      
      // Update cache
      this.cache.set(createdConversation.id, createdConversation);
      
      return createdConversation;

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Get conversation by ID with caching
   */
  async getConversationById(id: string): Promise<ResearchConversation> {
    try {
      // Check cache first
      const cached = this.cache.get(id);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('research_conversations')
        .select(`
          *,
          folder:conversation_folders(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw this.errorHandler.createError(
          'CONVERSATION_NOT_FOUND',
          `Conversation not found: ${id}`,
          error
        );
      }

      const conversation = this.mapToConversation(data);
      
      // Cache the result
      this.cache.set(id, conversation);
      
      return conversation;

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Get user's conversations with filtering and pagination
   */
  async getConversationList(
    filters: ConversationFilters = {},
    limit = 20,
    cursor?: string
  ): Promise<ConversationListResponse> {
    try {
      const cacheKey = `list_${JSON.stringify(filters)}_${limit}_${cursor || 'start'}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      let query = supabase
        .from('research_conversations')
        .select(`
          id,
          title,
          message_count,
          last_message_at,
          conversation_type,
          is_pinned,
          session_id,
          created_at,
          updated_at
        `)
        .eq('is_archived', false)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filters.type) {
        query = query.eq('conversation_type', filters.type);
      }

      if (filters.folderId) {
        query = query.eq('folder_id', filters.folderId);
      }

      if (filters.timeRange) {
        const timeFilter = this.getTimeFilter(filters.timeRange);
        if (timeFilter) {
          query = query.gte('updated_at', timeFilter.toISOString());
        }
      }

      // Apply cursor-based pagination
      if (cursor) {
        query = query.lt('updated_at', cursor);
      }

      query = query.limit(limit + 1); // Get one extra to check if there are more

      const { data, error } = await query;

      if (error) {
        throw this.errorHandler.createError(
          'CONVERSATION_LIST_FAILED',
          'Failed to fetch conversations',
          error
        );
      }

      const hasMore = data.length > limit;
      const conversations = data.slice(0, limit);
      
      // Get preview messages for each conversation
      const conversationItems = await this.enrichWithPreviews(conversations);

      const result: ConversationListResponse = {
        conversations: conversationItems,
        totalCount: conversations.length, // This would need a separate count query for exact total
        hasMore,
        nextCursor: hasMore ? conversations[conversations.length - 1]?.updated_at : undefined
      };

      // Cache the result for 5 minutes
      this.cache.set(cacheKey, result, 5 * 60 * 1000);
      
      return result;

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Search conversations by query
   */
  async searchConversations(
    query: string,
    filters: ConversationFilters = {},
    limit = 10
  ): Promise<ConversationListResponse> {
    try {
      if (!query.trim()) {
        return this.getConversationList(filters, limit);
      }

      // Search in conversation titles and message content
      const { data: conversationMatches, error: convError } = await supabase
        .from('research_conversations')
        .select(`
          id,
          title,
          message_count,
          last_message_at,
          conversation_type,
          is_pinned,
          session_id,
          created_at,
          updated_at
        `)
        .textSearch('title', query)
        .eq('is_archived', false)
        .limit(limit);

      if (convError) {
        throw this.errorHandler.createError(
          'CONVERSATION_SEARCH_FAILED',
          'Failed to search conversations',
          convError
        );
      }

      // Also search in message content
      const { data: messageMatches, error: msgError } = await supabase
        .from('conversation_messages')
        .select(`
          conversation_id,
          conversation:research_conversations!inner(
            id,
            title,
            message_count,
            last_message_at,
            conversation_type,
            is_pinned,
            session_id,
            created_at,
            updated_at
          )
        `)
        .textSearch('content', query)
        .limit(limit);

      if (msgError) {
        // Don't fail completely if message search fails
        console.warn('Message search failed:', msgError);
      }

      // Combine and deduplicate results
      const allMatches = [
        ...(conversationMatches || []),
        ...(messageMatches?.map(m => m.conversation).filter(Boolean) || [])
      ];

      const uniqueMatches = allMatches.reduce((acc, conv) => {
        if (!acc.some(c => c.id === conv.id)) {
          acc.push(conv);
        }
        return acc;
      }, [] as any[]);

      // Enrich with previews
      const conversationItems = await this.enrichWithPreviews(uniqueMatches);

      return {
        conversations: conversationItems,
        totalCount: conversationItems.length,
        hasMore: false
      };

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Update conversation metadata
   */
  async updateConversation(
    id: string, 
    updates: Partial<Pick<ResearchConversation, 'title' | 'isPinned' | 'folderId'>>
  ): Promise<ResearchConversation> {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.isPinned !== undefined) updateData.is_pinned = updates.isPinned;
      if (updates.folderId !== undefined) updateData.folder_id = updates.folderId;

      const { data, error } = await supabase
        .from('research_conversations')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw this.errorHandler.createError(
          'CONVERSATION_UPDATE_FAILED',
          `Failed to update conversation: ${id}`,
          error
        );
      }

      const conversation = this.mapToConversation(data);
      
      // Update cache
      this.cache.set(id, conversation);
      
      return conversation;

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Archive conversation (soft delete)
   */
  async archiveConversation(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('research_conversations')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) {
        throw this.errorHandler.createError(
          'CONVERSATION_ARCHIVE_FAILED',
          `Failed to archive conversation: ${id}`,
          error
        );
      }

      // Remove from cache
      this.cache.delete(id);
      this.cache.clear(); // Clear list cache as well

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Permanently delete conversation
   */
  async deleteConversation(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('research_conversations')
        .delete()
        .eq('id', id);

      if (error) {
        throw this.errorHandler.createError(
          'CONVERSATION_DELETE_FAILED',
          `Failed to delete conversation: ${id}`,
          error
        );
      }

      // Remove from cache
      this.cache.delete(id);
      this.cache.clear(); // Clear list cache as well

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Get conversation statistics for dashboard
   */
  async getConversationStats(): Promise<{
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
    totalCost: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_conversation_stats');

      if (error) {
        throw this.errorHandler.createError(
          'STATS_FETCH_FAILED',
          'Failed to fetch conversation statistics',
          error
        );
      }

      return data || {
        totalConversations: 0,
        activeConversations: 0,
        totalMessages: 0,
        totalCost: 0
      };

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  // Private helper methods

  private mapToConversation(row: ConversationRow & { folder?: any }): ResearchConversation {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      title: row.title,
      description: row.description,
      messageCount: row.message_count,
      lastMessageAt: row.last_message_at ? new Date(row.last_message_at) : undefined,
      conversationType: row.conversation_type as any,
      isPinned: row.is_pinned,
      isArchived: row.is_archived,
      folder: row.folder,
      folderId: row.folder_id,
      isShared: row.is_shared,
      shareToken: row.share_token,
      shareExpiresAt: row.share_expires_at ? new Date(row.share_expires_at) : undefined,
      contextMetadata: row.context_metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private async enrichWithPreviews(conversations: any[]): Promise<ConversationListItem[]> {
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        // Get the latest message for preview
        const { data: lastMessage } = await supabase
          .from('conversation_messages')
          .select('content, cost_usd')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Calculate total cost for conversation
        const { data: costData } = await supabase
          .from('conversation_messages')
          .select('cost_usd')
          .eq('conversation_id', conv.id);

        const totalCost = costData?.reduce((sum, msg) => sum + (msg.cost_usd || 0), 0) || 0;

        return {
          id: conv.id,
          title: conv.title,
          status: this.getConversationStatus(conv),
          preview: lastMessage?.content?.text || 'No messages yet',
          timestamp: new Date(conv.updated_at),
          isPinned: conv.is_pinned,
          messageCount: conv.message_count,
          totalCost: totalCost > 0 ? totalCost : undefined
        } as ConversationListItem;
      })
    );

    return enriched;
  }

  private getConversationStatus(conv: any): 'active' | 'completed' | 'needs_clarification' | 'failed' {
    // This would be determined by the associated research session status
    // For now, return a default based on message count and recent activity
    const lastActivity = new Date(conv.last_message_at || conv.updated_at);
    const hoursSinceLastActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
    
    if (conv.message_count === 0) return 'failed';
    if (hoursSinceLastActivity < 1) return 'active';
    return 'completed';
  }

  private getTimeFilter(timeRange: string): Date | null {
    const now = new Date();
    switch (timeRange) {
      case 'today':
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        return today;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return weekAgo;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return monthAgo;
      default:
        return null;
    }
  }

  private generateTitleFromContent(content: string): string {
    // Extract a meaningful title from the content
    const words = content.trim().split(/\s+/).slice(0, 8);
    const title = words.join(' ');
    return title.length > 50 ? title.slice(0, 47) + '...' : title;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}

// Export singleton instance
export const conversationService = new ConversationService();