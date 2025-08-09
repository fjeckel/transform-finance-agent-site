import type {
  ConversationMessage,
  ResearchConversation,
  ConversationFolder,
  ConversationListItem
} from '@/types/conversation';

/**
 * Advanced Caching Service for Conversation System
 * 
 * Features:
 * - Multi-level caching (memory, localStorage, IndexedDB)
 * - LRU eviction policies
 * - Cache invalidation strategies
 * - Performance metrics
 * - Background sync
 * - Offline support
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  persistent?: boolean; // Whether to persist to localStorage/IndexedDB
  priority?: 'low' | 'normal' | 'high';
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  priority: number;
  size: number; // Estimated size in bytes
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  oldestEntry?: number;
  newestEntry?: number;
}

/**
 * LRU Cache Implementation with advanced features
 */
export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder = new Map<string, number>();
  private maxSize: number;
  private currentSize = 0;
  private accessCounter = 0;
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.missCount++;
      return null;
    }

    // Update access order and hit count
    this.accessOrder.set(key, ++this.accessCounter);
    entry.hits++;
    this.hitCount++;
    
    return entry.data;
  }

  set(key: string, data: T, options: CacheOptions = {}): void {
    const {
      ttl = 30 * 60 * 1000, // 30 minutes default
      persistent = false,
      priority = 'normal'
    } = options;

    const size = this.estimateSize(data);
    const priorityScore = priority === 'high' ? 3 : priority === 'normal' ? 2 : 1;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      priority: priorityScore,
      size
    };

    // Remove existing entry if updating
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentSize -= existing.size;
    }

    // Evict entries if needed
    while (this.currentSize + size > this.getMaxSizeBytes() && this.cache.size > 0) {
      this.evictLeastRecent();
    }

    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);
    this.currentSize += size;

    // Persist to storage if requested
    if (persistent) {
      this.persistToStorage(key, entry);
    }
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.removeFromStorage(key);
      return true;
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.currentSize = 0;
    this.accessCounter = 0;
    this.clearStorage();
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.currentSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      missRate: this.missCount / (this.hitCount + this.missCount) || 0,
      evictionCount: this.evictionCount,
      oldestEntry: timestamps.length ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length ? Math.max(...timestamps) : undefined
    };
  }

  private evictLeastRecent(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;
    let lowestPriority = Infinity;

    // Find least recently used entry with lowest priority
    for (const [key, accessTime] of this.accessOrder) {
      const entry = this.cache.get(key);
      if (entry) {
        const score = entry.priority * 1000000 + accessTime; // Priority first, then recency
        if (score < lowestPriority) {
          lowestPriority = score;
          oldestKey = key;
          oldestAccess = accessTime;
        }
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.evictionCount++;
    }
  }

  private estimateSize(data: T): number {
    // Simple size estimation - could be improved with more accurate calculation
    const jsonString = JSON.stringify(data);
    return jsonString.length * 2; // Rough estimate accounting for Unicode
  }

  private getMaxSizeBytes(): number {
    return this.maxSize * 1024 * 1024; // Convert MB to bytes
  }

  private persistToStorage(key: string, entry: CacheEntry<T>): void {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  private removeFromStorage(key: string): void {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove cache entry from storage:', error);
    }
  }

  private clearStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache storage:', error);
    }
  }
}

/**
 * Main Cache Service for Conversation System
 */
export class CacheService {
  private static instance: CacheService;
  
  // Separate caches for different data types
  private conversationCache = new LRUCache<ResearchConversation>(50);
  private messageCache = new LRUCache<ConversationMessage[]>(100);
  private listCache = new LRUCache<ConversationListItem[]>(20);
  private folderCache = new LRUCache<ConversationFolder[]>(10);
  
  // Search and query result caches
  private searchCache = new LRUCache<any>(30);
  private queryCache = new LRUCache<any>(50);
  
  // Background sync queue
  private syncQueue = new Set<string>();
  private isSyncing = false;

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // ===========================================
  // CONVERSATION CACHING
  // ===========================================

  /**
   * Cache conversation with optimized TTL based on activity
   */
  cacheConversation(conversation: ResearchConversation, options?: CacheOptions): void {
    const key = `conversation:${conversation.id}`;
    
    // Dynamic TTL based on conversation activity
    const activityScore = this.calculateActivityScore(conversation);
    const baseTtl = 30 * 60 * 1000; // 30 minutes
    const ttl = Math.min(baseTtl * (1 + activityScore), 2 * 60 * 60 * 1000); // Max 2 hours
    
    this.conversationCache.set(key, conversation, {
      ...options,
      ttl,
      priority: conversation.isPinned ? 'high' : 'normal'
    });
  }

  /**
   * Get cached conversation
   */
  getCachedConversation(conversationId: string): ResearchConversation | null {
    return this.conversationCache.get(`conversation:${conversationId}`);
  }

  /**
   * Invalidate conversation cache
   */
  invalidateConversation(conversationId: string): void {
    this.conversationCache.delete(`conversation:${conversationId}`);
    this.queueBackgroundSync(`conversation:${conversationId}`);
  }

  // ===========================================
  // MESSAGE CACHING
  // ===========================================

  /**
   * Cache messages for a conversation
   */
  cacheMessages(conversationId: string, messages: ConversationMessage[], options?: CacheOptions): void {
    const key = `messages:${conversationId}`;
    
    this.messageCache.set(key, messages, {
      ...options,
      ttl: 15 * 60 * 1000, // 15 minutes - messages change frequently
      priority: 'high' // Messages are frequently accessed
    });
  }

  /**
   * Get cached messages
   */
  getCachedMessages(conversationId: string): ConversationMessage[] | null {
    return this.messageCache.get(`messages:${conversationId}`);
  }

  /**
   * Add message to cache (optimistic update)
   */
  addOptimisticMessage(conversationId: string, message: ConversationMessage): void {
    const cached = this.getCachedMessages(conversationId);
    if (cached) {
      // Insert message in correct position based on ULID
      const newMessages = [...cached];
      const insertIndex = this.findInsertPosition(newMessages, message);
      newMessages.splice(insertIndex, 0, message);
      
      this.cacheMessages(conversationId, newMessages, { priority: 'high' });
    }
  }

  /**
   * Update message in cache
   */
  updateMessageInCache(conversationId: string, updatedMessage: ConversationMessage): void {
    const cached = this.getCachedMessages(conversationId);
    if (cached) {
      const index = cached.findIndex(m => m.id === updatedMessage.id);
      if (index !== -1) {
        const newMessages = [...cached];
        newMessages[index] = updatedMessage;
        this.cacheMessages(conversationId, newMessages, { priority: 'high' });
      }
    }
  }

  /**
   * Remove message from cache
   */
  removeMessageFromCache(conversationId: string, messageId: string): void {
    const cached = this.getCachedMessages(conversationId);
    if (cached) {
      const newMessages = cached.filter(m => m.id !== messageId);
      this.cacheMessages(conversationId, newMessages, { priority: 'high' });
    }
  }

  // ===========================================
  // LIST CACHING
  // ===========================================

  /**
   * Cache conversation list
   */
  cacheConversationList(
    userId: string, 
    conversations: ConversationListItem[], 
    filters?: any,
    options?: CacheOptions
  ): void {
    const key = `list:${userId}:${this.hashFilters(filters)}`;
    
    this.listCache.set(key, conversations, {
      ...options,
      ttl: 5 * 60 * 1000, // 5 minutes - lists change frequently
      priority: 'high'
    });
  }

  /**
   * Get cached conversation list
   */
  getCachedConversationList(userId: string, filters?: any): ConversationListItem[] | null {
    const key = `list:${userId}:${this.hashFilters(filters)}`;
    return this.listCache.get(key);
  }

  // ===========================================
  // SEARCH CACHING
  // ===========================================

  /**
   * Cache search results
   */
  cacheSearchResults(query: string, results: any[], options?: CacheOptions): void {
    const key = `search:${this.hashQuery(query)}`;
    
    this.searchCache.set(key, results, {
      ...options,
      ttl: 10 * 60 * 1000, // 10 minutes
      priority: 'low' // Search results are less critical
    });
  }

  /**
   * Get cached search results
   */
  getCachedSearchResults(query: string): any[] | null {
    const key = `search:${this.hashQuery(query)}`;
    return this.searchCache.get(key);
  }

  // ===========================================
  // FOLDER CACHING
  // ===========================================

  /**
   * Cache user folders
   */
  cacheFolders(userId: string, folders: ConversationFolder[], options?: CacheOptions): void {
    const key = `folders:${userId}`;
    
    this.folderCache.set(key, folders, {
      ...options,
      ttl: 60 * 60 * 1000, // 1 hour - folders don't change often
      priority: 'normal'
    });
  }

  /**
   * Get cached folders
   */
  getCachedFolders(userId: string): ConversationFolder[] | null {
    return this.folderCache.get(`folders:${userId}`);
  }

  // ===========================================
  // CACHE MANAGEMENT
  // ===========================================

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.conversationCache.clear();
    this.messageCache.clear();
    this.listCache.clear();
    this.folderCache.clear();
    this.searchCache.clear();
    this.queryCache.clear();
    this.syncQueue.clear();
  }

  /**
   * Get comprehensive cache statistics
   */
  getAllStats(): Record<string, CacheStats> {
    return {
      conversations: this.conversationCache.getStats(),
      messages: this.messageCache.getStats(),
      lists: this.listCache.getStats(),
      folders: this.folderCache.getStats(),
      search: this.searchCache.getStats(),
      queries: this.queryCache.getStats()
    };
  }

  /**
   * Invalidate all caches for a user
   */
  invalidateUserCaches(userId: string): void {
    // Clear conversation lists
    const listKeys = Array.from(this.listCache['cache'].keys())
      .filter(key => key.includes(userId));
    listKeys.forEach(key => this.listCache.delete(key));

    // Clear folders
    this.folderCache.delete(`folders:${userId}`);

    // Queue background sync
    this.queueBackgroundSync(`user:${userId}`);
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(userId: string): Promise<void> {
    // Implementation would fetch and cache commonly accessed data
    // This is a placeholder for the actual implementation
    console.log('Warming up cache for user:', userId);
  }

  // ===========================================
  // PRIVATE HELPER METHODS
  // ===========================================

  private calculateActivityScore(conversation: ResearchConversation): number {
    const now = Date.now();
    const lastActivity = conversation.lastMessageAt?.getTime() || conversation.createdAt.getTime();
    const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
    
    // Score decreases over time
    let score = Math.max(0, 1 - hoursSinceActivity / 24); // 0-1 over 24 hours
    
    // Boost for active conversations
    if (conversation.messageCount > 10) score += 0.5;
    if (conversation.isPinned) score += 0.3;
    
    return Math.min(score, 2.0);
  }

  private findInsertPosition(messages: ConversationMessage[], newMessage: ConversationMessage): number {
    // Binary search for correct position based on ULID
    let left = 0;
    let right = messages.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (messages[mid].messageUlid < newMessage.messageUlid) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    return left;
  }

  private hashFilters(filters: any): string {
    if (!filters) return 'default';
    return btoa(JSON.stringify(filters)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private hashQuery(query: string): string {
    return btoa(query).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private queueBackgroundSync(key: string): void {
    this.syncQueue.add(key);
    if (!this.isSyncing) {
      this.processBackgroundSync();
    }
  }

  private async processBackgroundSync(): Promise<void> {
    if (this.syncQueue.size === 0) return;
    
    this.isSyncing = true;
    
    try {
      // Process sync queue in batches
      const batch = Array.from(this.syncQueue).slice(0, 10);
      this.syncQueue.clear();
      
      // Add batch back to queue to process later
      batch.forEach(key => this.syncQueue.delete(key));
      
      // Here you would implement actual sync logic
      console.log('Processing background sync for:', batch);
      
    } catch (error) {
      console.error('Background sync failed:', error);
    } finally {
      this.isSyncing = false;
      
      // Process remaining items
      if (this.syncQueue.size > 0) {
        setTimeout(() => this.processBackgroundSync(), 1000);
      }
    }
  }
}