// ErrorHandler - Comprehensive error handling with user-friendly messages
// Provides error classification, retry logic, and circuit breaker pattern

import { ConversationError } from '@/types/conversation';

export type ErrorCode = 
  | 'CONVERSATION_CREATE_FAILED'
  | 'CONVERSATION_NOT_FOUND'
  | 'CONVERSATION_UPDATE_FAILED'
  | 'CONVERSATION_DELETE_FAILED'
  | 'CONVERSATION_ARCHIVE_FAILED'
  | 'CONVERSATION_LIST_FAILED'
  | 'CONVERSATION_SEARCH_FAILED'
  | 'MESSAGE_CREATE_FAILED'
  | 'MESSAGE_UPDATE_FAILED'
  | 'MESSAGE_DELETE_FAILED'
  | 'MESSAGE_LIST_FAILED'
  | 'AI_PROVIDER_ERROR'
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMIT_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

interface ErrorContext {
  service: string;
  operation?: string;
  userId?: string;
  conversationId?: string;
  messageId?: string;
  timestamp: number;
  requestId?: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorCode[];
}

interface CircuitBreakerState {
  failures: number;
  successCount: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
  nextAttemptTime: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'NETWORK_ERROR',
    'SERVICE_UNAVAILABLE',
    'RATE_LIMIT_ERROR',
    'AI_PROVIDER_ERROR'
  ]
};

export class ErrorHandler {
  private retryConfig: RetryConfig;
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private errorCounts = new Map<string, number>();

  constructor(
    private service: string,
    retryConfig?: Partial<RetryConfig>
  ) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Create a standardized error
   */
  createError(
    code: ErrorCode, 
    message: string, 
    originalError?: any,
    context?: Partial<ErrorContext>
  ): ConversationError {
    const error: ConversationError = {
      code,
      message: this.getUserFriendlyMessage(code, message),
      details: {
        originalMessage: message,
        originalError: this.sanitizeError(originalError),
        context: {
          service: this.service,
          timestamp: Date.now(),
          ...context
        }
      }
    };

    this.logError(error);
    return error;
  }

  /**
   * Handle and classify errors
   */
  handleError(error: any, context?: Partial<ErrorContext>): ConversationError {
    if (this.isConversationError(error)) {
      return error;
    }

    const classified = this.classifyError(error);
    return this.createError(classified.code, classified.message, error, context);
  }

  /**
   * Execute operation with retry logic and circuit breaker
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    const circuitBreakerKey = `${this.service}:${operationName}`;
    
    // Check circuit breaker
    if (this.isCircuitBreakerOpen(circuitBreakerKey)) {
      throw this.createError(
        'SERVICE_UNAVAILABLE',
        `Service temporarily unavailable: ${operationName}`,
        null,
        context
      );
    }

    let lastError: any;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Success - reset circuit breaker
        this.recordSuccess(circuitBreakerKey);
        return result;
        
      } catch (error) {
        lastError = error;
        const classifiedError = this.classifyError(error);
        
        // Record failure for circuit breaker
        this.recordFailure(circuitBreakerKey);
        
        // Check if error is retryable
        if (!this.isRetryable(classifiedError.code) || attempt === this.retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * (delay * 0.1);
        
        await this.sleep(jitteredDelay);
      }
    }

    // All retries failed
    throw this.handleError(lastError, context);
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(code: ErrorCode, originalMessage: string): string {
    const messageMap: Record<ErrorCode, string> = {
      CONVERSATION_CREATE_FAILED: 'Unable to create new conversation. Please try again.',
      CONVERSATION_NOT_FOUND: 'Conversation not found. It may have been deleted.',
      CONVERSATION_UPDATE_FAILED: 'Failed to update conversation. Please try again.',
      CONVERSATION_DELETE_FAILED: 'Unable to delete conversation. Please try again.',
      CONVERSATION_ARCHIVE_FAILED: 'Failed to archive conversation. Please try again.',
      CONVERSATION_LIST_FAILED: 'Unable to load conversations. Please refresh the page.',
      CONVERSATION_SEARCH_FAILED: 'Search temporarily unavailable. Please try again.',
      MESSAGE_CREATE_FAILED: 'Failed to send message. Please check your connection and try again.',
      MESSAGE_UPDATE_FAILED: 'Failed to update message. Please try again.',
      MESSAGE_DELETE_FAILED: 'Unable to delete message. Please try again.',
      MESSAGE_LIST_FAILED: 'Unable to load messages. Please refresh the conversation.',
      AI_PROVIDER_ERROR: 'AI service is temporarily unavailable. Please try again in a few moments.',
      NETWORK_ERROR: 'Network connection issue. Please check your internet connection.',
      AUTHENTICATION_ERROR: 'Authentication required. Please sign in and try again.',
      PERMISSION_ERROR: 'You do not have permission to perform this action.',
      QUOTA_EXCEEDED: 'Usage quota exceeded. Please upgrade your plan or try again later.',
      RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',
      SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
      VALIDATION_ERROR: 'Invalid input. Please check your data and try again.',
      UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
    };

    return messageMap[code] || originalMessage;
  }

  /**
   * Get error recovery suggestions
   */
  getRecoverySuggestions(code: ErrorCode): string[] {
    const suggestionMap: Record<ErrorCode, string[]> = {
      NETWORK_ERROR: [
        'Check your internet connection',
        'Try refreshing the page',
        'Switch to a different network if available'
      ],
      AUTHENTICATION_ERROR: [
        'Sign out and sign back in',
        'Clear your browser cache',
        'Check if your session has expired'
      ],
      AI_PROVIDER_ERROR: [
        'Wait a few minutes and try again',
        'Try a different AI provider if available',
        'Check system status page'
      ],
      QUOTA_EXCEEDED: [
        'Upgrade your plan for higher limits',
        'Wait until your quota resets',
        'Review your usage patterns'
      ],
      RATE_LIMIT_ERROR: [
        'Wait a few seconds and try again',
        'Reduce the frequency of requests',
        'Try again during off-peak hours'
      ],
      SERVICE_UNAVAILABLE: [
        'Wait a few minutes and try again',
        'Check system status',
        'Try clearing your browser cache'
      ]
    };

    return suggestionMap[code] || ['Try refreshing the page', 'Contact support if the problem persists'];
  }

  /**
   * Check if error should trigger user notification
   */
  shouldNotifyUser(code: ErrorCode): boolean {
    const criticalErrors: ErrorCode[] = [
      'AUTHENTICATION_ERROR',
      'PERMISSION_ERROR',
      'QUOTA_EXCEEDED',
      'SERVICE_UNAVAILABLE'
    ];
    
    return criticalErrors.includes(code);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  /**
   * Clear error statistics
   */
  clearErrorStats(): void {
    this.errorCounts.clear();
  }

  // Private methods

  private classifyError(error: any): { code: ErrorCode; message: string } {
    // Network errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return { code: 'NETWORK_ERROR', message: 'Network connection failed' };
    }

    // Supabase/PostgreSQL errors
    if (error.code) {
      switch (error.code) {
        case '42501':
          return { code: 'PERMISSION_ERROR', message: 'Insufficient permissions' };
        case '23505':
          return { code: 'VALIDATION_ERROR', message: 'Duplicate entry' };
        case '23503':
          return { code: 'VALIDATION_ERROR', message: 'Reference constraint violation' };
        case '23502':
          return { code: 'VALIDATION_ERROR', message: 'Required field missing' };
      }
    }

    // HTTP status codes
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      
      switch (status) {
        case 401:
          return { code: 'AUTHENTICATION_ERROR', message: 'Authentication required' };
        case 403:
          return { code: 'PERMISSION_ERROR', message: 'Access forbidden' };
        case 404:
          return { code: 'CONVERSATION_NOT_FOUND', message: 'Resource not found' };
        case 429:
          return { code: 'RATE_LIMIT_ERROR', message: 'Rate limit exceeded' };
        case 503:
          return { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable' };
      }
    }

    // AI Provider errors
    if (error.message?.includes('AI') || error.provider) {
      return { code: 'AI_PROVIDER_ERROR', message: 'AI service error' };
    }

    return { code: 'UNKNOWN_ERROR', message: error.message || 'Unknown error occurred' };
  }

  private isConversationError(error: any): error is ConversationError {
    return error && typeof error.code === 'string' && typeof error.message === 'string';
  }

  private isRetryable(code: ErrorCode): boolean {
    return this.retryConfig.retryableErrors.includes(code);
  }

  private isCircuitBreakerOpen(key: string): boolean {
    const state = this.circuitBreakers.get(key);
    if (!state) return false;

    const now = Date.now();

    switch (state.state) {
      case 'closed':
        return false;
      case 'open':
        if (now >= state.nextAttemptTime) {
          state.state = 'half-open';
          return false;
        }
        return true;
      case 'half-open':
        return false;
    }
  }

  private recordSuccess(key: string): void {
    const state = this.circuitBreakers.get(key);
    if (state) {
      state.successCount++;
      state.failures = 0;
      
      // Reset to closed state after successful operation
      if (state.state === 'half-open') {
        state.state = 'closed';
      }
    }
  }

  private recordFailure(key: string): void {
    const state = this.circuitBreakers.get(key) || {
      failures: 0,
      successCount: 0,
      lastFailureTime: 0,
      state: 'closed' as const,
      nextAttemptTime: 0
    };

    state.failures++;
    state.lastFailureTime = Date.now();

    // Open circuit breaker after 5 consecutive failures
    if (state.failures >= 5 && state.state === 'closed') {
      state.state = 'open';
      state.nextAttemptTime = Date.now() + (30 * 1000); // 30 seconds
    }

    this.circuitBreakers.set(key, state);
  }

  private sanitizeError(error: any): any {
    if (!error) return null;

    // Remove sensitive information
    const sanitized = { ...error };
    delete sanitized.stack;
    delete sanitized.config;
    delete sanitized.request;
    delete sanitized.response?.config;
    delete sanitized.response?.request;

    return sanitized;
  }

  private logError(error: ConversationError): void {
    // Increment error count
    const count = this.errorCounts.get(error.code) || 0;
    this.errorCounts.set(error.code, count + 1);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${this.service}] ${error.code}: ${error.message}`, error.details);
    }

    // In production, you might want to send to error reporting service
    // Example: Sentry, Bugsnag, etc.
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}