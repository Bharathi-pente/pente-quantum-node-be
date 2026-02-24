/**
 * Redis Configuration
 * 
 * Provides a Redis client for caching and session management.
 * Falls back to in-memory cache if Redis is not available (development mode).
 */

import logger from './logger';

// In-memory cache fallback for development
class InMemoryCache {
  private cache: Map<string, { value: string; expiry: number | null }>;

  constructor() {
    this.cache = new Map();
    logger.info('[Cache] Using in-memory cache (Redis not configured)');
  }

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check expiry
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    const expiry = options?.EX ? Date.now() + options.EX * 1000 : null;
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return 0;

    // Check expiry
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return 0;
    }

    return 1;
  }

  async flushdb(): Promise<void> {
    this.cache.clear();
  }

  async quit(): Promise<void> {
    this.cache.clear();
  }

  async ping(): Promise<string> {
    return 'PONG';
  }
}

// Export cache client (in-memory for now, can be replaced with Redis later)
export const cacheClient = new InMemoryCache();

/**
 * Cache wrapper with error handling
 */
export class CacheService {
  /**
   * Get value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await cacheClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('[Cache] Error getting value:', error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  static async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await cacheClient.set(key, serialized, ttlSeconds ? { EX: ttlSeconds } : undefined);
    } catch (error) {
      logger.error('[Cache] Error setting value:', error);
    }
  }

  /**
   * Delete value from cache
   */
  static async del(key: string): Promise<void> {
    try {
      await cacheClient.del(key);
    } catch (error) {
      logger.error('[Cache] Error deleting value:', error);
    }
  }

  /**
   * Check if key exists in cache
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await cacheClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('[Cache] Error checking existence:', error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  static async clear(): Promise<void> {
    try {
      await cacheClient.flushdb();
      logger.info('[Cache] Cache cleared');
    } catch (error) {
      logger.error('[Cache] Error clearing cache:', error);
    }
  }

  /**
   * Generate cache key
   */
  static generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}

export default CacheService;
