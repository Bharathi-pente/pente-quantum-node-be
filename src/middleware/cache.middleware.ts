/**
 * Caching Middleware
 * 
 * Provides request-level caching for GET endpoints to improve performance
 */

import { Request, Response, NextFunction } from 'express';
import CacheService from '../config/redis';
import logger from '../config/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string; // Cache key prefix
  excludeQuery?: boolean; // Exclude query parameters from cache key
  invalidateOn?: string[]; // Methods that should invalidate this cache
}

/**
 * Cache middleware factory
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // Default 5 minutes
    keyPrefix = 'api',
    excludeQuery = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const userId = (req as any).userId || 'anonymous';
      const orgId = (req as any).orgId || 'no-org';
      const path = req.path;
      const query = excludeQuery ? '' : JSON.stringify(req.query);
      
      const cacheKey = CacheService.generateKey(keyPrefix, orgId, userId, path, query);

      // Try to get from cache
      const cachedData = await CacheService.get(cacheKey);

      if (cachedData) {
        logger.info(`[Cache] HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      logger.info(`[Cache] MISS: ${cacheKey}`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = function(body: any) {
        // Cache the response
        CacheService.set(cacheKey, body, ttl).catch((error) => {
          logger.error('[Cache] Error caching response:', error);
        });

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('[Cache] Middleware error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 * Clears cache when write operations occur
 */
export const invalidateCache = (pattern: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful response
    res.json = function(body: any) {
      // Only invalidate on successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const orgId = (req as any).orgId || 'no-org';
        const userId = (req as any).userId || 'anonymous';
        const cacheKey = CacheService.generateKey(pattern, orgId, userId);
        
        CacheService.del(cacheKey).catch((error) => {
          logger.error('[Cache] Error invalidating cache:', error);
        });
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Helper to invalidate multiple cache patterns
 */
export const invalidateMultiple = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function(body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const orgId = (req as any).orgId || 'no-org';
        const userId = (req as any).userId || 'anonymous';

        patterns.forEach((pattern) => {
          const cacheKey = CacheService.generateKey(pattern, orgId, userId);
          CacheService.del(cacheKey).catch((error) => {
            logger.error('[Cache] Error invalidating cache:', error);
          });
        });
      }

      return originalJson(body);
    };

    next();
  };
};
