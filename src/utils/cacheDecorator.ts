/**
 * Caching Decorator
 * 
 * Decorator to automatically cache controller method responses
 */

import { Request, Response, NextFunction } from 'express';
import { cacheService, CACHE_TTL } from '../services/cache.service';
import logger from '../config/logger';

/**
 * Cache decorator for controller methods
 * 
 * @param options - Cache configuration
 * 
 * @example
 * @Cache({ ttl: CACHE_TTL.MEDIUM, keyGenerator: (req) => `customers:${req.params.id}` })
 * async getCustomer(req: Request, res: Response) {
 *   // ... your code
 * }
 */
export function Cache(options: {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  tags?: string[];
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // Mark parameters as used to avoid TypeScript warnings
    void target;
    void propertyKey;
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
      try {
        // Check if caching is enabled
        if (process.env.CACHE_ENABLED === 'false') {
          return await originalMethod.apply(this, [req, res, next]);
        }

        // Check condition
        if (options.condition && !options.condition(req)) {
          return await originalMethod.apply(this, [req, res, next]);
        }

        // Generate cache key
        const cacheKey = options.keyGenerator
          ? options.keyGenerator(req)
          : `${req.method}:${req.originalUrl}`;

        // Try to get from cache
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          logger.debug(`Cache hit: ${cacheKey}`);
          res.setHeader('X-Cache', 'HIT');
          return res.json(cached);
        }

        // Not in cache, execute method
        logger.debug(`Cache miss: ${cacheKey}`);
        res.setHeader('X-Cache', 'MISS');

        // Intercept response to cache it
        const originalJson = res.json.bind(res);
        res.json = function (data: any) {
          // Cache the response
          const ttl = options.ttl || CACHE_TTL.MEDIUM;
          if (options.tags) {
            cacheService.setWithTags(cacheKey, data, options.tags, ttl);
          } else {
            cacheService.set(cacheKey, data, ttl);
          }

          // Send response
          return originalJson(data);
        };

        // Execute original method
        return await originalMethod.apply(this, [req, res, next]);
      } catch (error) {
        logger.error(`Cache decorator error:`, error);
        // If caching fails, just execute the method
        return await originalMethod.apply(this, [req, res, next]);
      }
    };

    return descriptor;
  };
}

/**
 * Middleware factory for caching routes
 * 
 * @example
 * router.get('/customers/:id', cacheMiddleware({ ttl: 300 }), getCustomer);
 */
export const cacheMiddleware = (options: {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if caching is enabled
      if (process.env.CACHE_ENABLED === 'false') {
        return next();
      }

      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Check condition
      if (options.condition && !options.condition(req)) {
        return next();
      }

      // Generate cache key
      const cacheKey = options.keyGenerator
        ? options.keyGenerator(req)
        : `${req.method}:${req.originalUrl}`;

      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit: ${cacheKey}`);
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Not in cache, continue to controller
      logger.debug(`Cache miss: ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');

      // Intercept response to cache it
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        // Cache the response
        const ttl = options.ttl || CACHE_TTL.MEDIUM;
        cacheService.set(cacheKey, data, ttl);

        // Send response
        return originalJson(data);
      };

      next();
    } catch (error: any) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};
