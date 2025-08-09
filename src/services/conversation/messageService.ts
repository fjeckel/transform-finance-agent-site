import { supabase } from '@/integrations/supabase/client';
import { AIProviderService, AIResponse } from './aiProviderService';
import type {
  ConversationMessage,
  SendMessageInput,
  MessageContent,
  MessageStatus,
  OptimisticMessage,
  MessageError,
  ReactionType,
  MessageReaction
} from '@/types/conversation';
import { AIProvider } from '@/types/research';

/**
 * ULID Generator for client-side message ordering
 * Based on Universally Unique Lexicographically Sortable Identifier spec
 */
export class ULIDGenerator {
  private static readonly ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  private static readonly ENCODING_LEN = 32;
  private static readonly TIME_MAX = Math.pow(2, 48) - 1;
  private static readonly TIME_LEN = 10;
  private static readonly RANDOM_LEN = 16;
  private static lastTime = 0;
  private static lastRandom = '';

  static generate(seedTime?: number): string {
    const now = seedTime || Date.now();
    
    if (now <= ULIDGenerator.lastTime) {
      // Same millisecond, increment random part
      const randomArray = ULIDGenerator.lastRandom.split('');
      for (let i = randomArray.length - 1; i >= 0; i--) {
        const charIndex = ULIDGenerator.ENCODING.indexOf(randomArray[i]);
        if (charIndex < ULIDGenerator.ENCODING_LEN - 1) {
          randomArray[i] = ULIDGenerator.ENCODING[charIndex + 1];
          break;
        } else {
          randomArray[i] = ULIDGenerator.ENCODING[0];
        }
      }
      ULIDGenerator.lastRandom = randomArray.join('');
    } else {
      // New millisecond, generate new random part
      ULIDGenerator.lastTime = now;
      ULIDGenerator.lastRandom = ULIDGenerator.randomPart();
    }

    return ULIDGenerator.encodeTime(now) + ULIDGenerator.lastRandom;
  }

  private static encodeTime(time: number): string {
    if (time > ULIDGenerator.TIME_MAX) {
      throw new Error('Time exceeds maximum allowed value');
    }

    let encoded = '';
    for (let i = ULIDGenerator.TIME_LEN - 1; i >= 0; i--) {
      const mod = time % ULIDGenerator.ENCODING_LEN;
      encoded = ULIDGenerator.ENCODING[mod] + encoded;
      time = Math.floor(time / ULIDGenerator.ENCODING_LEN);
    }

    return encoded;
  }

  private static randomPart(): string {
    let random = '';
    for (let i = 0; i < ULIDGenerator.RANDOM_LEN; i++) {
      random += ULIDGenerator.ENCODING[Math.floor(Math.random() * ULIDGenerator.ENCODING_LEN)];
    }
    return random;
  }

  /**
   * Extract timestamp from ULID
   */
  static getTimestamp(ulid: string): number {
    if (ulid.length !== 26) {
      throw new Error('Invalid ULID length');
    }

    const timeString = ulid.substring(0, ULIDGenerator.TIME_LEN);
    let time = 0;

    for (let i = 0; i < timeString.length; i++) {
      const charIndex = ULIDGenerator.ENCODING.indexOf(timeString[i]);
      if (charIndex === -1) {
        throw new Error('Invalid ULID character');
      }
      time = time * ULIDGenerator.ENCODING_LEN + charIndex;
    }

    return time;
  }
}

/**
 * Message Service for managing conversation messages
 * 
 * Features:
 * - ULID generation for ordered messages
 * - Optimistic updates for better UX
 * - Message status tracking
 * - Edit history management
 * - Reaction handling
 * - AI message generation
 */
export class MessageService {
  private static instance: MessageService;
  private aiProvider: AIProviderService;
  private optimisticMessages = new Map<string, OptimisticMessage>();
  private messageQueue = new Map<string, Promise<ConversationMessage>>();

  constructor() {
    this.aiProvider = AIProviderService.getInstance();
  }

  static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Send a message with AI response generation
   */
  async sendMessage(input: SendMessageInput): Promise<ConversationMessage> {
    const messageUlid = ULIDGenerator.generate();
    const tempId = `temp_${messageUlid}`;
    
    try {
      // Create optimistic user message
      const optimisticMessage = this.createOptimisticMessage({
        id: tempId,
        conversationId: input.conversationId,
        messageUlid,
        role: 'user',
        content: input.content,
        status: 'pending'
      });

      this.optimisticMessages.set(tempId, optimisticMessage);

      // Save user message to database
      const userMessage = await this.createMessage({
        conversationId: input.conversationId,
        messageUlid,
        role: 'user',
        content: input.content,
        status: 'sent',
        researchStep: input.researchStep,
        wizardStep: input.wizardStep
      });

      // Remove optimistic message and update with real one
      this.optimisticMessages.delete(tempId);

      // Generate AI response if provider is specified
      if (input.aiProvider) {
        await this.generateAIResponse(userMessage, input.aiProvider);
      }

      return userMessage;
    } catch (error) {
      // Update optimistic message with error
      const errorMessage: MessageError = {
        code: 'SEND_MESSAGE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to send message',
        retry: () => this.sendMessage(input)
      };

      const optimisticMessage = this.optimisticMessages.get(tempId);
      if (optimisticMessage) {
        optimisticMessage.error = errorMessage;
        optimisticMessage.status = 'error';
      }

      throw error;
    }
  }

  /**
   * Generate AI response to a user message
   */
  async generateAIResponse(
    userMessage: ConversationMessage, 
    aiProvider: AIProvider,
    model?: string
  ): Promise<ConversationMessage> {
    const responseUlid = ULIDGenerator.generate();
    const tempId = `temp_ai_${responseUlid}`;

    try {
      // Create optimistic AI response message
      const optimisticResponse = this.createOptimisticMessage({
        id: tempId,
        conversationId: userMessage.conversationId,
        messageUlid: responseUlid,
        role: 'assistant',
        content: { text: 'Thinking...' },
        status: 'processing',
        aiProvider,
        modelName: model
      });

      this.optimisticMessages.set(tempId, optimisticResponse);

      // Get conversation context
      const context = await this.getConversationContext(userMessage.conversationId);
      
      // Prepare messages for AI
      const messages = context.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: typeof msg.content === 'string' ? msg.content : msg.content.text
      }));

      // Generate AI response
      const aiResponse: AIResponse = await this.aiProvider.sendMessage({
        provider: aiProvider,
        messages,
        model,
        systemPrompt: this.buildSystemPrompt(context.metadata),
        researchContext: context.researchContext
      });

      // Save AI response to database
      const aiMessage = await this.createMessage({
        conversationId: userMessage.conversationId,
        messageUlid: responseUlid,
        role: 'assistant',
        content: aiResponse.content,
        status: 'sent',
        aiProvider,
        modelName: aiResponse.modelName,
        promptTokens: aiResponse.usage.promptTokens,
        completionTokens: aiResponse.usage.completionTokens,
        totalTokens: aiResponse.usage.totalTokens,
        costUsd: aiResponse.cost,
        processingTimeMs: aiResponse.processingTimeMs,
        researchStep: userMessage.researchStep,
        wizardStep: userMessage.wizardStep
      });

      // Remove optimistic message
      this.optimisticMessages.delete(tempId);

      return aiMessage;
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      
      // Update optimistic message with error
      const errorMessage: MessageError = {
        code: 'AI_RESPONSE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to generate AI response',
        retry: () => this.generateAIResponse(userMessage, aiProvider, model)
      };

      const optimisticMessage = this.optimisticMessages.get(tempId);
      if (optimisticMessage) {
        optimisticMessage.error = errorMessage;
        optimisticMessage.status = 'error';
        optimisticMessage.content = { text: 'Failed to generate response. Click to retry.' };
      }

      throw error;
    }
  }

  /**
   * Create a message in the database
   */
  private async createMessage(data: {
    conversationId: string;
    messageUlid: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: MessageContent;
    status: MessageStatus;
    aiProvider?: AIProvider;
    modelName?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    costUsd?: number;
    processingTimeMs?: number;
    researchStep?: string;
    wizardStep?: number;
  }): Promise<ConversationMessage> {
    const { data: result, error } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: data.conversationId,
        message_ulid: data.messageUlid,
        role: data.role,
        content: data.content,
        status: data.status,
        ai_provider: data.aiProvider,
        model_name: data.modelName,
        prompt_tokens: data.promptTokens || 0,
        completion_tokens: data.completionTokens || 0,
        total_tokens: data.totalTokens || 0,
        cost_usd: data.costUsd || 0,
        processing_time_ms: data.processingTimeMs || 0,
        research_step: data.researchStep,
        wizard_step: data.wizardStep
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: result.id,
      conversationId: result.conversation_id,
      messageUlid: result.message_ulid,
      threadId: result.thread_id,
      parentMessageId: result.parent_message_id,
      role: result.role,
      content: result.content,
      aiProvider: result.ai_provider,
      modelName: result.model_name,
      promptTokens: result.prompt_tokens || 0,
      completionTokens: result.completion_tokens || 0,
      totalTokens: result.total_tokens || 0,
      costUsd: parseFloat(result.cost_usd?.toString() || '0'),
      processingTimeMs: result.processing_time_ms || 0,
      status: result.status,
      researchStep: result.research_step,
      wizardStep: result.wizard_step,
      userRating: result.user_rating,
      userFeedback: result.user_feedback,
      reactions: [],
      editedAt: result.edited_at ? new Date(result.edited_at) : undefined,
      editCount: result.edit_count || 0,
      originalContent: result.original_content,
      createdAt: new Date(result.created_at)
    };
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
    const { error } = await supabase
      .from('conversation_messages')
      .update({ status })
      .eq('id', messageId);

    if (error) throw error;
  }

  /**
   * Edit a message (creates edit history)
   */
  async editMessage(messageId: string, newContent: MessageContent): Promise<ConversationMessage> {
    // Get current message
    const { data: currentMessage, error: fetchError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;

    // Update with edit history
    const { data, error } = await supabase
      .from('conversation_messages')
      .update({
        content: newContent,
        original_content: currentMessage.edit_count === 0 ? currentMessage.content : currentMessage.original_content,
        edit_count: (currentMessage.edit_count || 0) + 1,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      conversationId: data.conversation_id,
      messageUlid: data.message_ulid,
      threadId: data.thread_id,
      parentMessageId: data.parent_message_id,
      role: data.role,
      content: data.content,
      aiProvider: data.ai_provider,
      modelName: data.model_name,
      promptTokens: data.prompt_tokens || 0,
      completionTokens: data.completion_tokens || 0,
      totalTokens: data.total_tokens || 0,
      costUsd: parseFloat(data.cost_usd?.toString() || '0'),
      processingTimeMs: data.processing_time_ms || 0,
      status: data.status,
      researchStep: data.research_step,
      wizardStep: data.wizard_step,
      userRating: data.user_rating,
      userFeedback: data.user_feedback,
      reactions: [],
      editedAt: new Date(data.edited_at),
      editCount: data.edit_count,
      originalContent: data.original_content,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Add reaction to a message
   */
  async addReaction(messageId: string, reactionType: ReactionType): Promise<MessageReaction> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.user.id,
        reaction_type: reactionType
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate reaction by updating instead
      if (error.code === '23505') { // unique violation
        const { data: updated, error: updateError } = await supabase
          .from('message_reactions')
          .update({ reaction_type: reactionType })
          .eq('message_id', messageId)
          .eq('user_id', user.user.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        data = updated;
      } else {
        throw error;
      }
    }

    return {
      id: data.id,
      messageId: data.message_id,
      userId: data.user_id,
      reactionType: data.reaction_type,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(messageId: string, reactionType: ReactionType): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.user.id)
      .eq('reaction_type', reactionType);

    if (error) throw error;
  }

  /**
   * Get conversation context for AI generation
   */
  private async getConversationContext(conversationId: string) {
    // Get recent messages for context
    const { data: messages, error: messagesError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('message_ulid', { ascending: true })
      .limit(20); // Last 20 messages for context

    if (messagesError) throw messagesError;

    // Get conversation metadata
    const { data: conversation, error: convError } = await supabase
      .from('research_conversations')
      .select('context_metadata, session_id')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    // Get research session context if available
    let researchContext = null;
    if (conversation.session_id) {
      const { data: session } = await supabase
        .from('research_sessions')
        .select('query_text, config, final_results, status')
        .eq('id', conversation.session_id)
        .single();
      
      researchContext = session;
    }

    return {
      messages: messages || [],
      metadata: conversation.context_metadata || {},
      researchContext
    };
  }

  /**
   * Build system prompt based on conversation context
   */
  private buildSystemPrompt(metadata: Record<string, any>): string {
    const basePrompt = `You are a financial research assistant helping users analyze and understand finance-related topics. You provide accurate, well-researched, and actionable insights.

Key guidelines:
- Be precise and factual in your responses
- Cite sources when making claims about market data or financial information
- Explain complex concepts in accessible terms
- Provide actionable insights when relevant
- If you're unsure about something, say so rather than guessing`;

    // Add context-specific instructions based on metadata
    const contextPrompts = [];
    
    if (metadata.research_type === 'company_analysis') {
      contextPrompts.push('Focus on company fundamentals, financial metrics, and business model analysis.');
    }
    
    if (metadata.research_type === 'market_research') {
      contextPrompts.push('Emphasize market trends, sector analysis, and macroeconomic factors.');
    }
    
    if (metadata.wizard_step) {
      contextPrompts.push(`This is part of a structured research workflow (step ${metadata.wizard_step}). Provide focused guidance for this step.`);
    }

    return contextPrompts.length > 0 
      ? `${basePrompt}\n\nContext: ${contextPrompts.join(' ')}`
      : basePrompt;
  }

  /**
   * Create optimistic message for UI updates
   */
  private createOptimisticMessage(data: {
    id: string;
    conversationId: string;
    messageUlid: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: MessageContent;
    status: MessageStatus;
    aiProvider?: AIProvider;
    modelName?: string;
  }): OptimisticMessage {
    return {
      id: data.id,
      conversationId: data.conversationId,
      messageUlid: data.messageUlid,
      role: data.role,
      content: data.content,
      status: data.status,
      aiProvider: data.aiProvider,
      modelName: data.modelName,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUsd: 0,
      processingTimeMs: 0,
      editCount: 0,
      reactions: [],
      isOptimistic: true,
      createdAt: new Date()
    };
  }

  /**
   * Get optimistic messages for UI
   */
  getOptimisticMessages(conversationId: string): OptimisticMessage[] {
    return Array.from(this.optimisticMessages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.messageUlid.localeCompare(b.messageUlid));
  }

  /**
   * Clear optimistic messages for conversation
   */
  clearOptimisticMessages(conversationId: string): void {
    for (const [id, message] of this.optimisticMessages) {
      if (message.conversationId === conversationId) {
        this.optimisticMessages.delete(id);
      }
    }
  }

  /**
   * Retry failed message
   */
  async retryMessage(messageId: string): Promise<ConversationMessage> {
    const optimisticMessage = this.optimisticMessages.get(messageId);
    if (!optimisticMessage?.error?.retry) {
      throw new Error('Message cannot be retried');
    }

    return await optimisticMessage.error.retry();
  }
}