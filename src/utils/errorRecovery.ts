/**
 * Error Recovery Utilities
 * Provides smart retry logic and error recovery strategies
 */

interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  retryableErrors: string[];
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  timeoutMs: number;
  resetTimeoutMs: number;
}

type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.config.timeoutMs)
        )
      ]);

      // Success - reset circuit breaker
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
      }
      this.failures = 0;
      return result;

    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.config.failureThreshold) {
        this.state = 'OPEN';
      }

      throw error;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

class ErrorRecovery {
  private static circuitBreakers: Map<string, CircuitBreaker> = new Map();

  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const defaultConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      exponentialBase: 2,
      retryableErrors: [
        'network_error',
        'timeout',
        'rate_limit',
        'service_unavailable',
        'temporary_failure'
      ]
    };

    const finalConfig = { ...defaultConfig, ...config };
    let lastError: Error;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        const isRetryable = finalConfig.retryableErrors.some(retryableError =>
          lastError.message.toLowerCase().includes(retryableError.toLowerCase())
        );

        if (!isRetryable || attempt === finalConfig.maxAttempts) {
          throw lastError;
        }

        // Calculate delay with exponential backoff and jitter
        const baseDelay = finalConfig.baseDelayMs * Math.pow(finalConfig.exponentialBase, attempt - 1);
        const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
        const delay = Math.min(baseDelay + jitter, finalConfig.maxDelayMs);

        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  static withCircuitBreaker<T>(
    operationKey: string,
    operation: () => Promise<T>,
    config: Partial<CircuitBreakerConfig> = {}
  ): Promise<T> {
    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      timeoutMs: 30000,
      resetTimeoutMs: 60000
    };

    const finalConfig = { ...defaultConfig, ...config };

    if (!this.circuitBreakers.has(operationKey)) {
      this.circuitBreakers.set(operationKey, new CircuitBreaker(finalConfig));
    }

    const circuitBreaker = this.circuitBreakers.get(operationKey)!;
    return circuitBreaker.execute(operation);
  }

  static async withRetryAndCircuitBreaker<T>(
    operationKey: string,
    operation: () => Promise<T>,
    retryConfig: Partial<RetryConfig> = {},
    circuitBreakerConfig: Partial<CircuitBreakerConfig> = {}
  ): Promise<T> {
    return this.withCircuitBreaker(
      operationKey,
      () => this.withRetry(operation, retryConfig),
      circuitBreakerConfig
    );
  }

  static getCircuitBreakerState(operationKey: string): CircuitBreakerState | null {
    const circuitBreaker = this.circuitBreakers.get(operationKey);
    return circuitBreaker ? circuitBreaker.getState() : null;
  }

  static resetCircuitBreaker(operationKey: string): void {
    const circuitBreaker = this.circuitBreakers.get(operationKey);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  static async handleServiceError(error: Error, serviceName: string): Promise<{
    shouldRetry: boolean;
    recoveryAction?: string;
    userMessage: string;
  }> {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        shouldRetry: true,
        recoveryAction: 'checkConnection',
        userMessage: 'Network connection issue. Please check your internet connection and try again.'
      };
    }
    
    if (errorMessage.includes('rate limit')) {
      return {
        shouldRetry: true,
        recoveryAction: 'backoff',
        userMessage: 'Rate limit exceeded. Please wait a moment before trying again.'
      };
    }
    
    if (errorMessage.includes('timeout')) {
      return {
        shouldRetry: true,
        recoveryAction: 'reduceScope',
        userMessage: 'Request timed out. Try reducing the complexity of your request.'
      };
    }
    
    if (errorMessage.includes('not a function') || errorMessage.includes('undefined')) {
      return {
        shouldRetry: false,
        recoveryAction: 'reload',
        userMessage: 'Application error detected. Please refresh the page to resolve the issue.'
      };
    }
    
    return {
      shouldRetry: false,
      userMessage: 'An unexpected error occurred. Please try again or contact support if the issue persists.'
    };
  }
}

export { ErrorRecovery, CircuitBreaker, type RetryConfig, type CircuitBreakerConfig, type CircuitBreakerState };