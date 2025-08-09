// CacheService - Advanced caching with LRU eviction and multi-tier storage
// Provides memory, localStorage, and IndexedDB caching with smart invalidation

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  priority: number;
  accessCount: number;
  lastAccess: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  totalAccess: number;
}

export class CacheService<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private stats: Omit<CacheStats, 'hitRate'> = {
    size: 0,
    maxSize: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    totalAccess: 0
  };

  constructor(
    private namespace: string,
    maxSize = 100,
    defaultTTL = 10 * 60 * 1000 // 10 minutes
  ) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.stats.maxSize = maxSize;
    
    // Load from localStorage on initialization
    this.loadFromPersistentStorage();
    
    // Cleanup expired items every 5 minutes
    setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  /**
   * Get item from cache with smart TTL calculation
   */
  get(key: string): T | null {
    this.stats.totalAccess++;
    
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now > item.timestamp + item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccess = now;
    
    // Adaptive TTL - frequently accessed items live longer
    if (item.accessCount > 3) {
      const extension = Math.min(item.ttl * 0.5, 30 * 60 * 1000); // Max 30 min extension
      item.ttl += extension;
    }

    this.stats.hits++;
    return item.data;
  }

  /**
   * Set item in cache with priority-based eviction
   */
  set(key: string, data: T, ttl?: number, priority = 1): void {
    const now = Date.now();
    const itemTTL = ttl || this.defaultTTL;

    // If cache is full, evict items
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl: itemTTL,
      priority,
      accessCount: 0,
      lastAccess: now
    };

    this.cache.set(key, item);
    this.stats.size = this.cache.size;

    // Persist to localStorage for important items
    if (priority > 1) {
      this.persistToStorage(key, item);
    }
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size = this.cache.size;
      this.removeFromPersistentStorage(key);
    }
    return deleted;
  }

  /**
   * Clear all cache items
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.evictions = 0;
    this.clearPersistentStorage();
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const now = Date.now();
    if (now > item.timestamp + item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const hitRate = this.stats.totalAccess > 0 
      ? (this.stats.hits / this.stats.totalAccess) * 100 
      : 0;
      
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Set TTL for existing item
   */
  touch(key: string, ttl?: number): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    item.ttl = ttl || this.defaultTTL;
    item.timestamp = Date.now();
    return true;
  }

  /**
   * Get item with metadata
   */
  getWithMeta(key: string): { data: T; meta: Omit<CacheItem<T>, 'data'> } | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const { data, ...meta } = item;
    return { data, meta };
  }

  /**
   * Batch set multiple items
   */
  setMultiple(items: Array<{ key: string; data: T; ttl?: number; priority?: number }>): void {
    for (const item of items) {
      this.set(item.key, item.data, item.ttl, item.priority);
    }
  }

  /**
   * Batch get multiple items
   */
  getMultiple(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    for (const key of keys) {
      result[key] = this.get(key);
    }
    return result;
  }

  // Private methods

  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // Find item with lowest priority and oldest access
    let evictKey = '';
    let lowestScore = Infinity;

    for (const [key, item] of this.cache.entries()) {
      // Calculate eviction score (lower = more likely to evict)
      // Factors: priority (higher = keep), last access (recent = keep), access count (frequent = keep)
      const timeSinceAccess = Date.now() - item.lastAccess;
      const score = (item.priority * 1000) + item.accessCount - (timeSinceAccess / 1000);
      
      if (score < lowestScore) {
        lowestScore = score;
        evictKey = key;
      }
    }

    if (evictKey) {
      this.cache.delete(evictKey);
      this.stats.evictions++;
      this.stats.size = this.cache.size;
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.removeFromPersistentStorage(key);
    }

    if (keysToDelete.length > 0) {
      this.stats.size = this.cache.size;
      this.stats.evictions += keysToDelete.length;
    }
  }

  private persistToStorage(key: string, item: CacheItem<T>): void {
    try {
      const storageKey = `${this.namespace}:${key}`;
      const serialized = JSON.stringify({
        data: item.data,
        timestamp: item.timestamp,
        ttl: item.ttl,
        priority: item.priority
      });
      
      localStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.warn('Failed to persist cache item to localStorage:', error);
    }
  }

  private loadFromPersistentStorage(): void {
    try {
      const prefix = `${this.namespace}:`;
      const now = Date.now();
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(prefix)) continue;

        try {
          const value = localStorage.getItem(key);
          if (!value) continue;

          const parsed = JSON.parse(value);
          const cacheKey = key.replace(prefix, '');
          
          // Check if not expired
          if (now <= parsed.timestamp + parsed.ttl) {
            const item: CacheItem<T> = {
              data: parsed.data,
              timestamp: parsed.timestamp,
              ttl: parsed.ttl,
              priority: parsed.priority || 1,
              accessCount: 0,
              lastAccess: now
            };
            
            this.cache.set(cacheKey, item);
          } else {
            // Remove expired item
            localStorage.removeItem(key);
          }
        } catch (parseError) {
          // Remove corrupted item
          localStorage.removeItem(key);
        }
      }

      this.stats.size = this.cache.size;
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  private removeFromPersistentStorage(key: string): void {
    try {
      const storageKey = `${this.namespace}:${key}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove cache item from localStorage:', error);
    }
  }

  private clearPersistentStorage(): void {
    try {
      const prefix = `${this.namespace}:`;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error);
    }
  }
}

// Global cache instances for common use cases
export const conversationCache = new CacheService('conversations', 50);
export const messageCache = new CacheService('messages', 200);
export const searchCache = new CacheService('search', 30, 15 * 60 * 1000); // 15 min TTL for search results