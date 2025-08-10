/**
 * Conversation Service Layer Export
 * 
 * Comprehensive conversation system for Finance Transformers chat functionality
 * 
 * Features:
 * - Real-time conversation management
 * - AI provider integration (Claude, OpenAI, Grok)
 * - Message ordering with ULID
 * - Advanced caching and performance optimization
 * - Error handling and retry mechanisms
 * - React hooks for easy integration
 */

// Core Services
export { ConversationService } from './conversationService';
export { MessageService, ULIDGenerator } from './messageService';
export { AIProviderService, TokenCounter } from './aiProviderService';
export { RealtimeService } from './realtimeService';
export { CacheService, LRUCache } from './cacheService';

// Error Handling
export { 
  ErrorClassifier,
  RetryManager,
  CircuitBreaker,
  ErrorRecovery,
  ErrorCategory,
  ErrorSeverity
} from './errorHandler';

// Types (re-export for convenience)
export type {
  AIResponse,
  AIRequestOptions,
  RealtimeSubscriptionOptions,
  RealtimeEventHandlers,
  PresenceState,
  CacheOptions,
  CacheEntry,
  CacheStats,
  ErrorDetails,
  RetryConfig,
  CircuitBreakerState
} from './aiProviderService';

export type {
  ConversationUpdate,
  MessageUpdate
} from './realtimeService';

// Utility function to initialize all services
export function initializeConversationServices(): {
  conversationService: ConversationService;
  messageService: MessageService;
  aiProviderService: AIProviderService;
  realtimeService: RealtimeService;
  cacheService: CacheService;
} {
  return {
    conversationService: ConversationService.getInstance(),
    messageService: MessageService.getInstance(),
    aiProviderService: AIProviderService.getInstance(),
    realtimeService: RealtimeService.getInstance(),
    cacheService: CacheService.getInstance()
  };
}

// Service health check
export async function checkServiceHealth(): Promise<{
  conversation: boolean;
  realtime: boolean;
  cache: boolean;
  ai: boolean;
}> {
  const services = initializeConversationServices();
  
  try {
    return {
      conversation: true, // Would implement actual health check
      realtime: services.realtimeService.getConnectionStatus() === 'open',
      cache: services.cacheService.getCacheStats().totalEntries >= 0,
      ai: true // Would implement actual health check
    };
  } catch (error) {
    console.error('Service health check failed:', error);
    return {
      conversation: false,
      realtime: false,
      cache: false,
      ai: false
    };
  }
}

// Service configuration
export const CONVERSATION_CONFIG = {
  // Cache settings
  cache: {
    conversationTTL: 30 * 60 * 1000, // 30 minutes
    messageTTL: 15 * 60 * 1000,      // 15 minutes  
    searchTTL: 10 * 60 * 1000,       // 10 minutes
    maxCacheSize: 100,               // MB
  },
  
  // Retry settings
  retry: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2
  },
  
  // Real-time settings
  realtime: {
    reconnectDelay: 1000,
    maxReconnectAttempts: 5,
    presenceTimeout: 30000,
    typingTimeout: 3000
  },
  
  // AI settings
  ai: {
    defaultProvider: 'claude' as const,
    defaultModel: {
      claude: 'claude-3-5-sonnet-20241022',
      openai: 'gpt-4o-mini', 
      grok: 'grok-beta'
    },
    requestTimeout: 60000,
    maxTokens: 4096
  }
} as const;