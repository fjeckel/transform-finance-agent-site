import { AIProvider } from '@/types/research';
import { MessageContent } from '@/types/conversation';

/**
 * AI Provider Service for integrating with Claude, OpenAI, and Grok
 * 
 * Provides unified interface for:
 * - Token counting
 * - Cost calculation
 * - API calls with retry logic
 * - Response formatting
 */

export interface AIResponse {
  content: MessageContent;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  processingTimeMs: number;
  modelName: string;
  provider: AIProvider;
  metadata?: Record<string, any>;
}

export interface AIRequestOptions {
  provider: AIProvider;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  researchContext?: any;
  retryCount?: number;
}

/**
 * Token counting and cost calculation utilities
 */
export class TokenCounter {
  /**
   * Estimate tokens for text (rough approximation)
   */
  static estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost based on provider and usage
   */
  static calculateCost(provider: AIProvider, promptTokens: number, completionTokens: number, model?: string): number {
    const costs = this.getProviderCosts();
    const providerCost = costs[provider];
    
    if (!providerCost) return 0;

    // Use model-specific pricing if available
    const modelCost = model && providerCost.models?.[model] ? providerCost.models[model] : providerCost.default;
    
    const promptCost = (promptTokens / 1000) * modelCost.input;
    const completionCost = (completionTokens / 1000) * modelCost.output;
    
    return promptCost + completionCost;
  }

  private static getProviderCosts() {
    return {
      claude: {
        default: {
          input: 0.0015,  // $1.50 per 1K input tokens (Claude-3.5-Sonnet)
          output: 0.0075  // $7.50 per 1K output tokens
        },
        models: {
          'claude-3-5-sonnet-20241022': {
            input: 0.003,   // $3.00 per 1K tokens
            output: 0.015   // $15.00 per 1K tokens
          },
          'claude-3-haiku-20240307': {
            input: 0.00025, // $0.25 per 1K tokens
            output: 0.00125 // $1.25 per 1K tokens
          }
        }
      },
      openai: {
        default: {
          input: 0.0015,  // GPT-4 Turbo
          output: 0.002
        },
        models: {
          'gpt-4o': {
            input: 0.005,   // $5.00 per 1K input tokens
            output: 0.015   // $15.00 per 1K output tokens
          },
          'gpt-4o-mini': {
            input: 0.00015, // $0.15 per 1K input tokens
            output: 0.0006  // $0.60 per 1K output tokens
          },
          'gpt-4-turbo': {
            input: 0.01,    // $10.00 per 1K input tokens
            output: 0.03    // $30.00 per 1K output tokens
          }
        }
      },
      grok: {
        default: {
          input: 0.0005,  // Estimated - Grok pricing not public yet
          output: 0.0015
        },
        models: {
          'grok-beta': {
            input: 0.0005,
            output: 0.0015
          }
        }
      }
    };
  }
}

/**
 * Main AI Provider Service
 */
export class AIProviderService {
  private static instance: AIProviderService;
  private retryDelays = [1000, 2000, 4000, 8000]; // Exponential backoff

  static getInstance(): AIProviderService {
    if (!AIProviderService.instance) {
      AIProviderService.instance = new AIProviderService();
    }
    return AIProviderService.instance;
  }

  /**
   * Send message to AI provider with unified response
   */
  async sendMessage(options: AIRequestOptions): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      let response: AIResponse;
      
      switch (options.provider) {
        case 'claude':
          response = await this.sendToClaude(options);
          break;
        case 'openai':
          response = await this.sendToOpenAI(options);
          break;
        case 'grok':
          response = await this.sendToGrok(options);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${options.provider}`);
      }

      response.processingTimeMs = Date.now() - startTime;
      return response;
      
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      
      // Retry logic for transient errors
      if (this.shouldRetry(error) && (options.retryCount || 0) < this.retryDelays.length) {
        const retryCount = (options.retryCount || 0) + 1;
        const delay = this.retryDelays[retryCount - 1];
        
        console.warn(`AI request failed, retrying in ${delay}ms (attempt ${retryCount}):`, error);
        
        await this.delay(delay);
        return this.sendMessage({ ...options, retryCount });
      }
      
      throw new Error(`AI request failed after ${options.retryCount || 0} retries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send message to Claude via Supabase Edge Function
   */
  private async sendToClaude(options: AIRequestOptions): Promise<AIResponse> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const payload = {
      messages: options.messages,
      model: options.model || 'claude-3-5-sonnet-20241022',
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4096,
      system: options.systemPrompt,
      research_context: options.researchContext
    };

    const { data, error } = await supabase.functions.invoke('ai-research-claude', {
      body: payload
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Claude API request failed');

    const result = data.result;
    
    return {
      content: {
        text: result.content,
        metadata: result.metadata
      },
      usage: {
        promptTokens: result.usage?.input_tokens || 0,
        completionTokens: result.usage?.output_tokens || 0,
        totalTokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)
      },
      cost: TokenCounter.calculateCost(
        'claude', 
        result.usage?.input_tokens || 0, 
        result.usage?.output_tokens || 0,
        payload.model
      ),
      processingTimeMs: 0, // Will be set by caller
      modelName: payload.model,
      provider: 'claude',
      metadata: {
        stop_reason: result.stop_reason,
        stop_sequence: result.stop_sequence
      }
    };
  }

  /**
   * Send message to OpenAI via Supabase Edge Function
   */
  private async sendToOpenAI(options: AIRequestOptions): Promise<AIResponse> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const payload = {
      messages: options.messages,
      model: options.model || 'gpt-4o-mini',
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4096,
      research_context: options.researchContext
    };

    // Add system message if provided
    if (options.systemPrompt) {
      payload.messages = [
        { role: 'system', content: options.systemPrompt },
        ...options.messages
      ];
    }

    const { data, error } = await supabase.functions.invoke('ai-research-openai', {
      body: payload
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'OpenAI API request failed');

    const result = data.result;
    const choice = result.choices?.[0];
    
    if (!choice) throw new Error('No response from OpenAI');
    
    return {
      content: {
        text: choice.message.content,
        metadata: {
          finish_reason: choice.finish_reason,
          index: choice.index
        }
      },
      usage: {
        promptTokens: result.usage?.prompt_tokens || 0,
        completionTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0
      },
      cost: TokenCounter.calculateCost(
        'openai', 
        result.usage?.prompt_tokens || 0, 
        result.usage?.completion_tokens || 0,
        payload.model
      ),
      processingTimeMs: 0, // Will be set by caller
      modelName: payload.model,
      provider: 'openai',
      metadata: {
        model: result.model,
        created: result.created,
        system_fingerprint: result.system_fingerprint
      }
    };
  }

  /**
   * Send message to Grok (x.ai) via Supabase Edge Function
   */
  private async sendToGrok(options: AIRequestOptions): Promise<AIResponse> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const payload = {
      messages: options.messages,
      model: options.model || 'grok-beta',
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4096,
      research_context: options.researchContext
    };

    // Add system message if provided
    if (options.systemPrompt) {
      payload.messages = [
        { role: 'system', content: options.systemPrompt },
        ...options.messages
      ];
    }

    const { data, error } = await supabase.functions.invoke('ai-research-grok', {
      body: payload
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Grok API request failed');

    const result = data.result;
    const choice = result.choices?.[0];
    
    if (!choice) throw new Error('No response from Grok');
    
    return {
      content: {
        text: choice.message.content,
        metadata: {
          finish_reason: choice.finish_reason,
          index: choice.index
        }
      },
      usage: {
        promptTokens: result.usage?.prompt_tokens || 0,
        completionTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0
      },
      cost: TokenCounter.calculateCost(
        'grok', 
        result.usage?.prompt_tokens || 0, 
        result.usage?.completion_tokens || 0,
        payload.model
      ),
      processingTimeMs: 0, // Will be set by caller
      modelName: payload.model,
      provider: 'grok',
      metadata: {
        model: result.model,
        created: result.created
      }
    };
  }

  /**
   * Check if error should trigger a retry
   */
  private shouldRetry(error: any): boolean {
    if (typeof error === 'string') {
      return error.includes('rate limit') || 
             error.includes('timeout') || 
             error.includes('network') ||
             error.includes('503') ||
             error.includes('502');
    }
    
    if (error instanceof Error) {
      return error.message.includes('rate limit') ||
             error.message.includes('timeout') ||
             error.message.includes('network') ||
             error.message.includes('503') ||
             error.message.includes('502');
    }
    
    return false;
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get available models for a provider
   */
  getAvailableModels(provider: AIProvider): string[] {
    const models = {
      claude: [
        'claude-3-5-sonnet-20241022',
        'claude-3-haiku-20240307',
        'claude-3-opus-20240229'
      ],
      openai: [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-3.5-turbo'
      ],
      grok: [
        'grok-beta',
        'grok-2-1212'
      ]
    };
    
    return models[provider] || [];
  }

  /**
   * Get recommended model for a provider based on use case
   */
  getRecommendedModel(provider: AIProvider, useCase: 'speed' | 'quality' | 'cost' = 'quality'): string {
    const recommendations = {
      claude: {
        speed: 'claude-3-haiku-20240307',
        quality: 'claude-3-5-sonnet-20241022',
        cost: 'claude-3-haiku-20240307'
      },
      openai: {
        speed: 'gpt-4o-mini',
        quality: 'gpt-4o',
        cost: 'gpt-4o-mini'
      },
      grok: {
        speed: 'grok-beta',
        quality: 'grok-2-1212',
        cost: 'grok-beta'
      }
    };
    
    return recommendations[provider]?.[useCase] || this.getAvailableModels(provider)[0];
  }
}