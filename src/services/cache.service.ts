/**
 * Enhanced Cache Service
 * 
 * Aggressive caching strategy for read-heavy endpoints
 */

import { Redis } from 'ioredis';
import logger from '../config/logger';

// Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
});

redis.on('error', (err) => {
  logger.error('Redis Cache Error:', err);
});

redis.on('connect', () => {
  logger.info('✅ Redis cache connected');
});

// Connect to Redis
redis.connect().catch((err) => {
  logger.error('Failed to connect to Redis:', err);
});

/**
 * Cache key prefixes for different data types
 */
export const CACHE_PREFIXES = {
  CUSTOMER: 'customer',
  ORGANIZATION: 'org',
  PRODUCT: 'product',
  INVOICE: 'invoice',
  PRICING_MODEL: 'pricing',
  TAX: 'tax',
  CURRENCY: 'currency',
  METER: 'meter',
  FEATURE: 'feature',
  USER: 'user',
  RATE_CARD: 'ratecard',
};

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

/**
 * Cache invalidation tags
 */
export const CACHE_TAGS = {
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  INVOICES: 'invoices',
  ORGANIZATIONS: 'organizations',
};

export class CacheService {
  private redis: Redis;
  private defaultTTL: number = CACHE_TTL.MEDIUM;

  constructor(redisClient: Redis = redis) {
    this.redis = redisClient;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error: any) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      return true;
    } catch (error: any) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error: any) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;

      await this.redis.del(...keys);
      return keys.length;
    } catch (error: any) {
      logger.error(`Cache delete pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error: any) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set (cache-aside pattern)
   * If data exists in cache, return it. Otherwise, fetch from source and cache it.
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Not in cache, fetch from source
      const data = await fetcher();

      // Store in cache for next time
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl);
      }

      return data;
    } catch (error: any) {
      logger.error(`Cache getOrSet error for key ${key}:`, error);
      // Fallback to fetcher
      return await fetcher();
    }
  }

  /**
   * Cache with tags for bulk invalidation
   */
  async setWithTags(
    key: string,
    value: any,
    tags: string[],
    ttl: number = this.defaultTTL
  ): Promise<boolean> {
    try {
      // Set the main value
      await this.set(key, value, ttl);

      // Add key to each tag set
      const pipeline = this.redis.pipeline();
      tags.forEach(tag => {
        pipeline.sadd(`tag:${tag}`, key);
        pipeline.expire(`tag:${tag}`, ttl + 60); // Tag TTL slightly longer
      });
      await pipeline.exec();

      return true;
    } catch (error: any) {
      logger.error(`Cache setWithTags error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateTag(tag: string): Promise<number> {
    try {
      const keys = await this.redis.smembers(`tag:${tag}`);
      if (keys.length === 0) return 0;

      // Delete all keys
      await this.redis.del(...keys);

      // Delete the tag set
      await this.redis.del(`tag:${tag}`);

      logger.info(`Invalidated ${keys.length} keys with tag: ${tag}`);
      return keys.length;
    } catch (error: any) {
      logger.error(`Cache invalidateTag error for tag ${tag}:`, error);
      return 0;
    }
  }

  /**
   * Increment a counter (useful for rate limiting, metrics)
   */
  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const value = await this.redis.incr(key);
      if (ttl && value === 1) {
        // Set TTL only on first increment
        await this.redis.expire(key, ttl);
      }
      return value;
    } catch (error: any) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Cache a list/array with pagination support
   */
  async setList(key: string, items: any[], ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      const serialized = JSON.stringify(items);
      await this.redis.setex(key, ttl, serialized);
      return true;
    } catch (error: any) {
      logger.error(`Cache setList error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmup(
    keys: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>
  ): Promise<void> {
    logger.info(`Starting cache warmup for ${keys.length} keys...`);

    try {
      await Promise.all(
        keys.map(async ({ key, fetcher, ttl }) => {
          try {
            const data = await fetcher();
            await this.set(key, data, ttl || this.defaultTTL);
          } catch (error: any) {
            logger.error(`Failed to warm up cache for key ${key}:`, error);
          }
        })
      );

      logger.info(`✅ Cache warmup completed`);
    } catch (error: any) {
      logger.error('Cache warmup error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      logger.info('Cache flushed');
      return true;
    } catch (error: any) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      const info = await this.redis.info('stats');
      const keys = await this.redis.dbsize();

      return {
        keys,
        info,
      };
    } catch (error: any) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Helper functions for common cache operations

/**
 * Cache customer data
 */
export const cacheCustomer = async (customerId: string, data: any) => {
  const key = `${CACHE_PREFIXES.CUSTOMER}:${customerId}`;
  return await cacheService.setWithTags(key, data, [CACHE_TAGS.CUSTOMERS], CACHE_TTL.MEDIUM);
};

/**
 * Get cached customer
 */
export const getCachedCustomer = async (customerId: string) => {
  const key = `${CACHE_PREFIXES.CUSTOMER}:${customerId}`;
  return await cacheService.get(key);
};

/**
 * Invalidate customer cache
 */
export const invalidateCustomerCache = async (customerId: string) => {
  const key = `${CACHE_PREFIXES.CUSTOMER}:${customerId}`;
  return await cacheService.delete(key);
};

/**
 * Invalidate all customers cache
 */
export const invalidateAllCustomersCache = async () => {
  return await cacheService.invalidateTag(CACHE_TAGS.CUSTOMERS);
};

logger.info('✅ Enhanced cache service initialized');
