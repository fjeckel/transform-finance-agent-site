// Advanced rate limiting and retry logic for AI Research system

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  provider: 'openai' | 'claude' | 'parallel';
  retryAfterMs?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterMs: number;
  retryableErrors: string[];
}

export interface RateLimitState {
  requests: number[];
  lastReset: number;
  isBlocked: boolean;
  unblockTime?: number;
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  error?: string;
  timestamp: number;
}

export interface RequestMetrics {
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  averageRetryAttempts: number;
  averageResponseTime: number;
  lastRequestTime?: number;
}

class RateLimitingService {
  private rateLimits = new Map<string, RateLimitState>();
  private requestMetrics = new Map<string, RequestMetrics>();

  // Default rate limit configurations for different providers
  private defaultConfigs: Record<string, RateLimitConfig> = {
    openai: {
      maxRequests: 50,
      windowMs: 60000, // 1 minute
      provider: 'openai',
      retryAfterMs: 60000
    },
    claude: {
      maxRequests: 40,
      windowMs: 60000, // 1 minute  
      provider: 'claude',
      retryAfterMs: 60000
    },
    parallel: {
      maxRequests: 30,
      windowMs: 60000, // 1 minute (more conservative for parallel)
      provider: 'parallel',
      retryAfterMs: 120000
    }
  };

  // Default retry configuration
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitterMs: 500,
    retryableErrors: [
      'rate_limit_exceeded',
      'service_unavailable',
      'timeout',
      'network_error',
      'temporary_failure'
    ]
  };

  /**
   * Check if request is allowed under current rate limits
   */
  async checkRateLimit(provider: string, config?: Partial<RateLimitConfig>): Promise<{
    allowed: boolean;
    retryAfterMs?: number;
    remainingRequests?: number;
  }> {
    const rateLimitConfig = { ...this.defaultConfigs[provider], ...config };
    const now = Date.now();
    const key = `${provider}_${rateLimitConfig.windowMs}`;
    
    let state = this.rateLimits.get(key);
    if (!state) {
      state = {
        requests: [],
        lastReset: now,
        isBlocked: false
      };
      this.rateLimits.set(key, state);
    }

    // Clean up old requests outside the window
    state.requests = state.requests.filter(
      timestamp => now - timestamp < rateLimitConfig.windowMs
    );

    // Check if we're currently blocked
    if (state.isBlocked && state.unblockTime && now < state.unblockTime) {
      return {
        allowed: false,
        retryAfterMs: state.unblockTime - now
      };
    }

    // Reset block if time has passed
    if (state.isBlocked && state.unblockTime && now >= state.unblockTime) {
      state.isBlocked = false;
      state.unblockTime = undefined;
    }

    // Check if we've exceeded the limit
    if (state.requests.length >= rateLimitConfig.maxRequests) {
      state.isBlocked = true;
      state.unblockTime = now + (rateLimitConfig.retryAfterMs || rateLimitConfig.windowMs);
      
      this.updateMetrics(provider, 'rate_limited');
      
      return {
        allowed: false,
        retryAfterMs: rateLimitConfig.retryAfterMs || rateLimitConfig.windowMs
      };
    }

    // Request is allowed
    state.requests.push(now);
    return {
      allowed: true,
      remainingRequests: rateLimitConfig.maxRequests - state.requests.length
    };
  }

  /**
   * Execute a function with retry logic and rate limiting
   */
  async executeWithRetry<T>(
    provider: string,
    fn: () => Promise<T>,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    const attempts: RetryAttempt[] = [];
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        // Check rate limit before attempting
        const rateLimitCheck = await this.checkRateLimit(provider);
        
        if (!rateLimitCheck.allowed) {
          const delay = rateLimitCheck.retryAfterMs || 60000;
          attempts.push({
            attempt,
            delay,
            error: 'rate_limit_exceeded',
            timestamp: Date.now()
          });

          if (attempt <= config.maxRetries) {
            console.warn(`Rate limit exceeded for ${provider}, waiting ${delay}ms before retry ${attempt}/${config.maxRetries}`);
            await this.delay(delay);
            continue;
          } else {
            throw new Error(`Rate limit exceeded for ${provider} after ${config.maxRetries} retries`);
          }
        }

        // Execute the function
        const startTime = Date.now();
        const result = await fn();
        const responseTime = Date.now() - startTime;

        // Update success metrics
        this.updateMetrics(provider, 'success', responseTime, attempts.length);
        
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const responseTime = Date.now() - (attempts[attempts.length - 1]?.timestamp || Date.now());
        
        // Check if error is retryable
        const errorCode = this.extractErrorCode(lastError);
        const isRetryable = config.retryableErrors.includes(errorCode);
        
        attempts.push({
          attempt,
          delay: 0,
          error: errorCode,
          timestamp: Date.now()
        });

        // Update failure metrics
        this.updateMetrics(provider, 'failure', responseTime, attempts.length);

        if (!isRetryable || attempt > config.maxRetries) {
          throw lastError;
        }

        // Calculate backoff delay with jitter
        const baseDelay = Math.min(
          config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelayMs
        );
        const jitter = Math.random() * config.jitterMs;
        const delay = baseDelay + jitter;

        attempts[attempts.length - 1].delay = delay;

        console.warn(`Attempt ${attempt} failed for ${provider}: ${lastError.message}. Retrying in ${delay.toFixed(0)}ms`);
        await this.delay(delay);
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Get current metrics for a provider
   */
  getMetrics(provider: string): RequestMetrics | null {
    return this.requestMetrics.get(provider) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, RequestMetrics> {
    const metrics: Record<string, RequestMetrics> = {};
    this.requestMetrics.forEach((value, key) => {
      metrics[key] = value;
    });
    return metrics;
  }

  /**
   * Reset rate limits for a provider (for testing or admin purposes)
   */
  resetRateLimit(provider: string): void {
    const keys = Array.from(this.rateLimits.keys()).filter(key => key.startsWith(provider));
    keys.forEach(key => this.rateLimits.delete(key));
  }

  /**
   * Reset all rate limits
   */
  resetAllRateLimits(): void {
    this.rateLimits.clear();
  }

  /**
   * Get current rate limit status for a provider
   */
  getRateLimitStatus(provider: string): {
    isBlocked: boolean;
    remainingRequests: number;
    resetTimeMs?: number;
    windowMs: number;
  } {
    const config = this.defaultConfigs[provider];
    const key = `${provider}_${config.windowMs}`;
    const state = this.rateLimits.get(key);

    if (!state) {
      return {
        isBlocked: false,
        remainingRequests: config.maxRequests,
        windowMs: config.windowMs
      };
    }

    const now = Date.now();
    const validRequests = state.requests.filter(
      timestamp => now - timestamp < config.windowMs
    );

    return {
      isBlocked: state.isBlocked,
      remainingRequests: Math.max(0, config.maxRequests - validRequests.length),
      resetTimeMs: state.unblockTime,
      windowMs: config.windowMs
    };
  }

  /**
   * Estimate wait time before next request is allowed
   */
  estimateWaitTime(provider: string): number {
    const status = this.getRateLimitStatus(provider);
    
    if (!status.isBlocked) {
      return 0;
    }

    return Math.max(0, (status.resetTimeMs || 0) - Date.now());
  }

  /**
   * Create a rate-limited version of a function
   */
  createRateLimitedFunction<T extends any[], R>(
    provider: string,
    fn: (...args: T) => Promise<R>,
    retryConfig?: Partial<RetryConfig>
  ): (...args: T) => Promise<R> {
    return (...args: T) => {
      return this.executeWithRetry(provider, () => fn(...args), retryConfig);
    };
  }

  /**
   * Batch process multiple requests with rate limiting
   */
  async processBatch<T, R>(
    provider: string,
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number = 3,
    retryConfig?: Partial<RetryConfig>
  ): Promise<Array<{ success: boolean; result?: R; error?: string; item: T }>> {
    const results: Array<{ success: boolean; result?: R; error?: string; item: T }> = [];
    const batches: T[][] = [];
    
    // Split items into batches
    for (let i = 0; i < items.length; i += concurrency) {
      batches.push(items.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (item) => {
        try {
          const result = await this.executeWithRetry(
            provider,
            () => processor(item),
            retryConfig
          );
          return { success: true, result, item };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            item
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add small delay between batches to be respectful
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(100);
      }
    }

    return results;
  }

  // Private helper methods
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractErrorCode(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('rate limit') || message.includes('429')) {
      return 'rate_limit_exceeded';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'network_error';
    }
    if (message.includes('503') || message.includes('unavailable')) {
      return 'service_unavailable';
    }
    if (message.includes('500') || message.includes('502') || message.includes('504')) {
      return 'temporary_failure';
    }
    
    return 'unknown_error';
  }

  private updateMetrics(
    provider: string,
    type: 'success' | 'failure' | 'rate_limited',
    responseTime?: number,
    retryAttempts?: number
  ): void {
    let metrics = this.requestMetrics.get(provider);
    
    if (!metrics) {
      metrics = {
        provider,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitedRequests: 0,
        averageRetryAttempts: 0,
        averageResponseTime: 0
      };
      this.requestMetrics.set(provider, metrics);
    }

    metrics.totalRequests++;
    metrics.lastRequestTime = Date.now();

    switch (type) {
      case 'success':
        metrics.successfulRequests++;
        break;
      case 'failure':
        metrics.failedRequests++;
        break;
      case 'rate_limited':
        metrics.rateLimitedRequests++;
        break;
    }

    // Update averages
    if (responseTime !== undefined) {
      metrics.averageResponseTime = 
        (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests;
    }

    if (retryAttempts !== undefined) {
      metrics.averageRetryAttempts = 
        (metrics.averageRetryAttempts * (metrics.totalRequests - 1) + retryAttempts) / metrics.totalRequests;
    }
  }
}

// Singleton instance
export const rateLimitingService = new RateLimitingService();

// Export utility functions for direct use
export const withRateLimit = <T extends any[], R>(
  provider: string,
  fn: (...args: T) => Promise<R>,
  retryConfig?: Partial<RetryConfig>
): ((...args: T) => Promise<R>) => {
  return rateLimitingService.createRateLimitedFunction(provider, fn, retryConfig);
};

export const checkProviderRateLimit = (provider: string) => {
  return rateLimitingService.checkRateLimit(provider);
};

export const getProviderMetrics = (provider: string) => {
  return rateLimitingService.getMetrics(provider);
};