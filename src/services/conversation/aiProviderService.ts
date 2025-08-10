// AIProviderService - Unified AI provider integration for Claude, OpenAI, and Grok
// Handles message generation, cost calculation, and response processing

import { supabase } from '@/integrations/supabase/client';
import { AIProvider } from '@/types/research';
import { ConversationMessage, MessageContent } from '@/types/conversation';
import { ErrorHandler } from './errorHandler';

interface AIProviderConfig {
  provider: AIProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
}

interface AIResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  processingTime: number;
  metadata?: Record<string, any>;
}

interface AIProviderPricing {
  inputTokenPrice: number;  // per 1000 tokens
  outputTokenPrice: number; // per 1000 tokens
}

// Pricing data for different AI providers (as of 2024)
const AI_PROVIDER_PRICING: Record<string, AIProviderPricing> = {
  // Claude models
  'claude-3-5-sonnet-20241022': { inputTokenPrice: 0.003, outputTokenPrice: 0.015 },
  'claude-3-5-haiku-20241022': { inputTokenPrice: 0.0008, outputTokenPrice: 0.004 },
  'claude-3-opus-20240229': { inputTokenPrice: 0.015, outputTokenPrice: 0.075 },
  
  // OpenAI models
  'gpt-4o': { inputTokenPrice: 0.0025, outputTokenPrice: 0.01 },
  'gpt-4o-mini': { inputTokenPrice: 0.00015, outputTokenPrice: 0.0006 },
  'gpt-4-turbo': { inputTokenPrice: 0.01, outputTokenPrice: 0.03 },
  'gpt-4': { inputTokenPrice: 0.03, outputTokenPrice: 0.06 },
  'gpt-3.5-turbo': { inputTokenPrice: 0.0005, outputTokenPrice: 0.0015 },
  
  // Grok models
  'grok-beta': { inputTokenPrice: 0.005, outputTokenPrice: 0.015 },
  'grok-vision-beta': { inputTokenPrice: 0.01, outputTokenPrice: 0.03 }
};

// Recommended models for different use cases
const MODEL_RECOMMENDATIONS = {
  research: {
    claude: 'claude-3-5-sonnet-20241022',
    openai: 'gpt-4o',
    grok: 'grok-beta'
  },
  chat: {
    claude: 'claude-3-5-haiku-20241022',
    openai: 'gpt-4o-mini',
    grok: 'grok-beta'
  },
  analysis: {
    claude: 'claude-3-5-sonnet-20241022',
    openai: 'gpt-4o',
    grok: 'grok-beta'
  }
};

export class AIProviderService {
  private errorHandler = new ErrorHandler('AIProviderService');

  /**
   * Generate AI response using specified provider
   */
  async generateResponse(
    config: AIProviderConfig,
    messages: Array<{ role: string; content: string }>,
    context?: {
      conversationId: string;
      researchStep?: string;
      wizardStep?: number;
    }
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      let response: AIResponse;

      switch (config.provider) {
        case 'claude':
          response = await this.callClaude(config, messages, context);
          break;
        case 'openai':
          response = await this.callOpenAI(config, messages, context);
          break;
        case 'grok':
          response = await this.callGrok(config, messages, context);
          break;
        default:
          throw this.errorHandler.createError(
            'AI_PROVIDER_ERROR',
            `Unsupported AI provider: ${config.provider}`
          );
      }

      response.processingTime = Date.now() - startTime;
      return response;

    } catch (error) {
      throw this.errorHandler.handleError(error, {
        operation: 'generateResponse',
        provider: config.provider
      });
    }
  }

  /**
   * Get recommended model for provider and use case
   */
  getRecommendedModel(
    provider: AIProvider, 
    useCase: 'research' | 'chat' | 'analysis' = 'research'
  ): string {
    return MODEL_RECOMMENDATIONS[useCase][provider];
  }

  /**
   * Calculate cost for token usage
   */
  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = AI_PROVIDER_PRICING[model];
    if (!pricing) {
      console.warn(`No pricing data for model: ${model}`);
      return 0;
    }

    const inputCost = (promptTokens / 1000) * pricing.inputTokenPrice;
    const outputCost = (completionTokens / 1000) * pricing.outputTokenPrice;
    
    return Math.round((inputCost + outputCost) * 10000) / 10000; // Round to 4 decimal places
  }

  /**
   * Get available models for a provider
   */
  getAvailableModels(provider: AIProvider): string[] {
    const models = Object.keys(AI_PROVIDER_PRICING);
    
    switch (provider) {
      case 'claude':
        return models.filter(m => m.startsWith('claude-'));
      case 'openai':
        return models.filter(m => m.startsWith('gpt-'));
      case 'grok':
        return models.filter(m => m.startsWith('grok-'));
      default:
        return [];
    }
  }

  /**
   * Validate provider configuration
   */
  validateConfig(config: AIProviderConfig): boolean {
    const availableModels = this.getAvailableModels(config.provider);
    
    if (!availableModels.includes(config.model)) {
      throw this.errorHandler.createError(
        'VALIDATION_ERROR',
        `Model ${config.model} not available for provider ${config.provider}`
      );
    }

    if (config.maxTokens < 1 || config.maxTokens > 8192) {
      throw this.errorHandler.createError(
        'VALIDATION_ERROR',
        'maxTokens must be between 1 and 8192'
      );
    }

    if (config.temperature < 0 || config.temperature > 2) {
      throw this.errorHandler.createError(
        'VALIDATION_ERROR',
        'temperature must be between 0 and 2'
      );
    }

    return true;
  }

  /**
   * Format messages for different providers
   */
  formatMessagesForProvider(
    provider: AIProvider,
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ): any[] {
    switch (provider) {
      case 'claude':
        return this.formatForClaude(messages, systemPrompt);
      case 'openai':
        return this.formatForOpenAI(messages, systemPrompt);
      case 'grok':
        return this.formatForGrok(messages, systemPrompt);
      default:
        return messages;
    }
  }

  // Private provider-specific methods

  private async callClaude(
    config: AIProviderConfig,
    messages: Array<{ role: string; content: string }>,
    context?: any
  ): Promise<AIResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw this.errorHandler.createError(
        'AUTHENTICATION_ERROR',
        'Authentication required for Claude API'
      );
    }

    const formattedMessages = this.formatForClaude(messages, config.systemPrompt);
    
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-research-claude`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20241022',
        messages: formattedMessages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: config.systemPrompt,
        metadata: context
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Claude API call failed');
    }

    const usage = result.usage || {};
    const cost = this.calculateCost(
      config.model || 'claude-3-5-sonnet-20241022',
      usage.input_tokens || 0,
      usage.output_tokens || 0
    );

    return {
      content: result.content || '',
      model: config.model || 'claude-3-5-sonnet-20241022',
      usage: {
        promptTokens: usage.input_tokens || 0,
        completionTokens: usage.output_tokens || 0,
        totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0)
      },
      cost,
      processingTime: 0,
      metadata: result.metadata || {}
    };
  }

  private async callOpenAI(
    config: AIProviderConfig,
    messages: Array<{ role: string; content: string }>,
    context?: any
  ): Promise<AIResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw this.errorHandler.createError(
        'AUTHENTICATION_ERROR',
        'Authentication required for OpenAI API'
      );
    }

    const formattedMessages = this.formatForOpenAI(messages, config.systemPrompt);
    
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-research-openai`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o',
        messages: formattedMessages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        metadata: context
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'OpenAI API call failed');
    }

    const usage = result.usage || {};
    const cost = this.calculateCost(
      config.model || 'gpt-4o',
      usage.prompt_tokens || 0,
      usage.completion_tokens || 0
    );

    return {
      content: result.content || '',
      model: config.model || 'gpt-4o',
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      },
      cost,
      processingTime: 0,
      metadata: result.metadata || {}
    };
  }

  private async callGrok(
    config: AIProviderConfig,
    messages: Array<{ role: string; content: string }>,
    context?: any
  ): Promise<AIResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw this.errorHandler.createError(
        'AUTHENTICATION_ERROR',
        'Authentication required for Grok API'
      );
    }

    const formattedMessages = this.formatForGrok(messages, config.systemPrompt);
    
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-research-grok`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || 'grok-beta',
        messages: formattedMessages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        metadata: context
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Grok API call failed');
    }

    const usage = result.usage || {};
    const cost = this.calculateCost(
      config.model || 'grok-beta',
      usage.prompt_tokens || 0,
      usage.completion_tokens || 0
    );

    return {
      content: result.content || '',
      model: config.model || 'grok-beta',
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      },
      cost,
      processingTime: 0,
      metadata: result.metadata || {}
    };
  }

  // Message formatting methods

  private formatForClaude(
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ): any[] {
    // Claude expects alternating user/assistant messages
    const formatted = messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role,
      content: msg.content
    }));

    // Add system prompt as first message if provided
    if (systemPrompt) {
      formatted.unshift({
        role: 'user',
        content: `System: ${systemPrompt}\n\nPlease acknowledge this system prompt and proceed with the conversation.`
      });
    }

    return formatted;
  }

  private formatForOpenAI(
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ): any[] {
    const formatted = [...messages];

    // Add system message at the beginning if provided
    if (systemPrompt) {
      formatted.unshift({
        role: 'system',
        content: systemPrompt
      });
    }

    return formatted;
  }

  private formatForGrok(
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ): any[] {
    // Grok follows OpenAI format
    return this.formatForOpenAI(messages, systemPrompt);
  }

  /**
   * Get provider status and health
   */
  async getProviderStatus(provider: AIProvider): Promise<{
    status: 'operational' | 'degraded' | 'offline';
    latency?: number;
    lastChecked: Date;
  }> {
    try {
      const startTime = Date.now();
      
      // Simple health check with minimal tokens
      const config: AIProviderConfig = {
        provider,
        model: this.getRecommendedModel(provider, 'chat'),
        maxTokens: 10,
        temperature: 0
      };

      await this.generateResponse(config, [
        { role: 'user', content: 'Hi' }
      ]);

      return {
        status: 'operational',
        latency: Date.now() - startTime,
        lastChecked: new Date()
      };

    } catch (error) {
      console.warn(`Provider ${provider} health check failed:`, error);
      return {
        status: 'offline',
        lastChecked: new Date()
      };
    }
  }
}

// Export singleton instance
export const aiProviderService = new AIProviderService();