// MessageService - Handles conversation messages with optimistic updates and AI integration
// Provides message CRUD, AI response generation, and real-time synchronization

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import {
  ConversationMessage,
  MessageContent,
  SendMessageInput,
  MessageStatus,
  OptimisticMessage,
  MessageReaction,
  ReactionType
} from '@/types/conversation';
import { AIProvider } from '@/types/research';
import { generateUlid } from '@/lib/ulid';
import { CacheService } from './cacheService';
import { ErrorHandler } from './errorHandler';
import { aiProviderService } from './aiProviderService';

type MessageRow = Database['public']['Tables']['conversation_messages']['Row'];
type MessageInsert = Database['public']['Tables']['conversation_messages']['Insert'];

interface MessageSendOptions {
  aiProvider?: AIProvider;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  generateAIResponse?: boolean;
  researchStep?: string;
  wizardStep?: number;
}

export class MessageService {
  private cache = new CacheService<ConversationMessage>('messages', 200);
  private errorHandler = new ErrorHandler('MessageService');
  private optimisticMessages = new Map<string, OptimisticMessage>();

  /**
   * Send a message with optional AI response generation
   */
  async sendMessage(
    input: SendMessageInput,
    options: MessageSendOptions = {}
  ): Promise<{
    userMessage: ConversationMessage;
    aiMessage?: ConversationMessage;
  }> {
    try {
      // Generate ULID for message ordering
      const messageUlid = generateUlid();
      
      // Create optimistic message for immediate UI feedback
      const optimisticId = `optimistic_${messageUlid}`;
      const optimisticMessage: OptimisticMessage = {
        id: optimisticId,
        conversationId: input.conversationId,
        messageUlid,
        role: 'user',
        content: input.content,
        status: 'pending',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        processingTimeMs: 0,
        editCount: 0,
        isOptimistic: true,
        aiProvider: options.aiProvider,
        researchStep: options.researchStep,
        wizardStep: options.wizardStep,
        createdAt: new Date()
      };

      // Store optimistic message for immediate UI updates
      this.optimisticMessages.set(optimisticId, optimisticMessage);

      // Insert user message to database
      const userMessageData: MessageInsert = {
        conversation_id: input.conversationId,
        message_ulid: messageUlid,
        role: 'user',
        content: input.content,
        status: 'sent',
        ai_provider: options.aiProvider,
        research_step: options.researchStep,
        wizard_step: options.wizardStep
      };

      const { data: userMessage, error: userError } = await supabase
        .from('conversation_messages')
        .insert(userMessageData)
        .select('*')
        .single();

      if (userError) {
        // Mark optimistic message as failed
        optimisticMessage.status = 'error';
        optimisticMessage.error = this.errorHandler.handleError(userError);
        
        throw this.errorHandler.createError(
          'MESSAGE_CREATE_FAILED',
          'Failed to send message',
          userError
        );
      }

      // Convert to domain object
      const sentUserMessage = this.mapToMessage(userMessage);
      
      // Remove optimistic message and cache the real one
      this.optimisticMessages.delete(optimisticId);
      this.cache.set(sentUserMessage.id, sentUserMessage);

      let aiResponse: ConversationMessage | undefined;

      // Generate AI response if requested
      if (options.generateAIResponse && options.aiProvider) {
        try {
          aiResponse = await this.generateAIResponse(
            input.conversationId,
            sentUserMessage,
            options
          );
        } catch (aiError) {
          console.error('AI response generation failed:', aiError);
          // Don't fail the entire operation if AI response fails
        }
      }

      return {
        userMessage: sentUserMessage,
        aiMessage: aiResponse
      };

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Get conversation messages with pagination
   */
  async getMessages(
    conversationId: string,
    limit = 50,
    cursor?: string
  ): Promise<{
    messages: ConversationMessage[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    try {
      const cacheKey = `conversation_${conversationId}_${limit}_${cursor || 'latest'}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      let query = supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('message_ulid', { ascending: true }); // ULID provides chronological ordering

      if (cursor) {
        query = query.gt('message_ulid', cursor);
      }

      query = query.limit(limit + 1); // Get one extra to check if there are more

      const { data, error } = await query;

      if (error) {
        throw this.errorHandler.createError(
          'MESSAGE_LIST_FAILED',
          'Failed to fetch messages',
          error
        );
      }

      const hasMore = data.length > limit;
      const messages = data.slice(0, limit).map(this.mapToMessage);
      
      const result = {
        messages,
        hasMore,
        nextCursor: hasMore ? messages[messages.length - 1]?.messageUlid : undefined
      };

      // Cache the result
      this.cache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes

      return result;

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Get optimistic messages for immediate UI updates
   */
  getOptimisticMessages(conversationId: string): OptimisticMessage[] {
    return Array.from(this.optimisticMessages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.messageUlid.localeCompare(b.messageUlid));
  }

  /**
   * Update message status (for real-time updates)
   */
  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversation_messages')
        .update({ status })
        .eq('id', messageId);

      if (error) {
        throw this.errorHandler.createError(
          'MESSAGE_UPDATE_FAILED',
          `Failed to update message status: ${messageId}`,
          error
        );
      }

      // Update cache
      const cached = this.cache.get(messageId);
      if (cached) {
        cached.status = status;
        this.cache.set(messageId, cached);
      }

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Edit an existing message
   */
  async editMessage(
    messageId: string, 
    newContent: MessageContent
  ): Promise<ConversationMessage> {
    try {
      // Get current message for edit history
      const { data: currentMessage, error: fetchError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (fetchError) {
        throw this.errorHandler.createError(
          'CONVERSATION_NOT_FOUND',
          `Message not found: ${messageId}`,
          fetchError
        );
      }

      // Update message with edit tracking
      const { data: updatedMessage, error: updateError } = await supabase
        .from('conversation_messages')
        .update({
          content: newContent,
          edited_at: new Date().toISOString(),
          edit_count: (currentMessage.edit_count || 0) + 1,
          original_content: currentMessage.original_content || currentMessage.content
        })
        .eq('id', messageId)
        .select('*')
        .single();

      if (updateError) {
        throw this.errorHandler.createError(
          'MESSAGE_UPDATE_FAILED',
          `Failed to edit message: ${messageId}`,
          updateError
        );
      }

      const message = this.mapToMessage(updatedMessage);
      
      // Update cache
      this.cache.set(messageId, message);
      
      return message;

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversation_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        throw this.errorHandler.createError(
          'MESSAGE_DELETE_FAILED',
          `Failed to delete message: ${messageId}`,
          error
        );
      }

      // Remove from cache
      this.cache.delete(messageId);

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Add reaction to a message
   */
  async addReaction(
    messageId: string, 
    reactionType: ReactionType
  ): Promise<MessageReaction> {
    try {
      const { data: reaction, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          reaction_type: reactionType
        })
        .select('*')
        .single();

      if (error) {
        throw this.errorHandler.createError(
          'MESSAGE_UPDATE_FAILED',
          'Failed to add reaction',
          error
        );
      }

      return {
        id: reaction.id,
        messageId: reaction.message_id,
        userId: reaction.user_id,
        reactionType: reaction.reaction_type as ReactionType,
        createdAt: new Date(reaction.created_at)
      };

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(messageId: string, reactionType: ReactionType): Promise<void> {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('reaction_type', reactionType);

      if (error) {
        throw this.errorHandler.createError(
          'MESSAGE_UPDATE_FAILED',
          'Failed to remove reaction',
          error
        );
      }

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Regenerate AI response for a message
   */
  async regenerateResponse(
    messageId: string,
    options: MessageSendOptions = {}
  ): Promise<ConversationMessage> {
    try {
      // Get the original message
      const { data: originalMessage, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (error) {
        throw this.errorHandler.createError(
          'CONVERSATION_NOT_FOUND',
          `Message not found: ${messageId}`,
          error
        );
      }

      const message = this.mapToMessage(originalMessage);
      
      // Generate new AI response
      const newResponse = await this.generateAIResponse(
        message.conversationId,
        message,
        options
      );

      return newResponse;

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  /**
   * Search messages within conversations
   */
  async searchMessages(
    query: string,
    conversationIds?: string[],
    limit = 20
  ): Promise<ConversationMessage[]> {
    try {
      let searchQuery = supabase
        .from('conversation_messages')
        .select('*')
        .textSearch('content', query)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (conversationIds && conversationIds.length > 0) {
        searchQuery = searchQuery.in('conversation_id', conversationIds);
      }

      const { data, error } = await searchQuery;

      if (error) {
        throw this.errorHandler.createError(
          'CONVERSATION_SEARCH_FAILED',
          'Failed to search messages',
          error
        );
      }

      return data.map(this.mapToMessage);

    } catch (error) {
      throw this.errorHandler.handleError(error);
    }
  }

  // Private methods

  private async generateAIResponse(
    conversationId: string,
    userMessage: ConversationMessage,
    options: MessageSendOptions
  ): Promise<ConversationMessage> {
    const startTime = Date.now();
    const aiMessageUlid = generateUlid();
    
    try {
      // Create optimistic AI message
      const optimisticId = `ai_optimistic_${aiMessageUlid}`;
      const optimisticAIMessage: OptimisticMessage = {
        id: optimisticId,
        conversationId,
        messageUlid: aiMessageUlid,
        role: 'assistant',
        content: { text: '' },
        status: 'processing',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        processingTimeMs: 0,
        editCount: 0,
        isOptimistic: true,
        aiProvider: options.aiProvider,
        modelName: options.model,
        researchStep: options.researchStep,
        wizardStep: options.wizardStep,
        createdAt: new Date()
      };

      this.optimisticMessages.set(optimisticId, optimisticAIMessage);

      // Get conversation history for context
      const { messages } = await this.getMessages(conversationId, 10);
      
      // Format messages for AI provider
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content.text
      }));

      // Add the new user message
      conversationHistory.push({
        role: 'user',
        content: userMessage.content.text
      });

      // Generate AI response
      const aiResponse = await aiProviderService.generateResponse(
        {
          provider: options.aiProvider!,
          model: options.model || aiProviderService.getRecommendedModel(options.aiProvider!, 'chat'),
          maxTokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7,
          systemPrompt: options.systemPrompt
        },
        conversationHistory,
        {
          conversationId,
          researchStep: options.researchStep,
          wizardStep: options.wizardStep
        }
      );

      // Insert AI response to database
      const aiMessageData: MessageInsert = {
        conversation_id: conversationId,
        message_ulid: aiMessageUlid,
        role: 'assistant',
        content: { text: aiResponse.content },
        status: 'sent',
        ai_provider: options.aiProvider,
        model_name: aiResponse.model,
        prompt_tokens: aiResponse.usage.promptTokens,
        completion_tokens: aiResponse.usage.completionTokens,
        total_tokens: aiResponse.usage.totalTokens,
        cost_usd: aiResponse.cost,
        processing_time_ms: Date.now() - startTime,
        research_step: options.researchStep,
        wizard_step: options.wizardStep
      };

      const { data: aiMessage, error: aiError } = await supabase
        .from('conversation_messages')
        .insert(aiMessageData)
        .select('*')
        .single();

      if (aiError) {
        // Mark optimistic message as failed
        optimisticAIMessage.status = 'error';
        optimisticAIMessage.error = this.errorHandler.handleError(aiError);
        
        throw this.errorHandler.createError(
          'MESSAGE_CREATE_FAILED',
          'Failed to save AI response',
          aiError
        );
      }

      const sentAIMessage = this.mapToMessage(aiMessage);
      
      // Remove optimistic message and cache the real one
      this.optimisticMessages.delete(optimisticId);
      this.cache.set(sentAIMessage.id, sentAIMessage);

      return sentAIMessage;

    } catch (error) {
      throw this.errorHandler.handleError(error, {
        operation: 'generateAIResponse',
        conversationId,
        provider: options.aiProvider
      });
    }
  }

  private mapToMessage(row: MessageRow): ConversationMessage {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      messageUlid: row.message_ulid,
      threadId: row.thread_id,
      parentMessageId: row.parent_message_id,
      role: row.role as any,
      content: row.content as MessageContent,
      aiProvider: row.ai_provider as AIProvider,
      modelName: row.model_name,
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      totalTokens: row.total_tokens,
      costUsd: row.cost_usd,
      processingTimeMs: row.processing_time_ms,
      status: row.status as MessageStatus,
      researchStep: row.research_step,
      wizardStep: row.wizard_step,
      userRating: row.user_rating,
      userFeedback: row.user_feedback,
      editedAt: row.edited_at ? new Date(row.edited_at) : undefined,
      editCount: row.edit_count,
      originalContent: row.original_content as MessageContent,
      createdAt: new Date(row.created_at)
    };
  }

  /**
   * Clear optimistic messages for a conversation
   */
  clearOptimisticMessages(conversationId: string): void {
    const keysToDelete = Array.from(this.optimisticMessages.keys())
      .filter(key => this.optimisticMessages.get(key)?.conversationId === conversationId);
    
    keysToDelete.forEach(key => this.optimisticMessages.delete(key));
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear message cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const messageService = new MessageService();