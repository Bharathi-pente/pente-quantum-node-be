/**
 * Rate Limiting Middleware
 * 
 * Provides comprehensive rate limiting with Redis store support
 * and adaptive throttling for different endpoint types
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    return (req as any).userId || req.ip || 'unknown';
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Stricter rate limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
  keyGenerator: (req: Request) => {
    // Use email if provided in body, otherwise IP
    return req.body?.email || req.ip || 'unknown';
  },
});

// Heavy operation limiter (for complex queries, exports, etc.)
export const heavyOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 heavy operations per hour
  message: 'Too many resource-intensive operations. Please try again later.',
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
});

// Write operation limiter (for create, update, delete)
export const writeOperationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 write operations per minute
  message: 'Too many write operations. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Search/query operation limiter
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 searches per minute
  message: 'Too many search requests. Please try again shortly.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom rate limiter factory
export const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Rate limit exceeded.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return (req as any).userId || req.ip || 'unknown';
    },
  });
};

/**
 * Adaptive rate limiter based on user authentication status
 */
export const adaptiveRateLimiter = (
  authenticatedMax: number,
  unauthenticatedMax: number,
  windowMs: number = 15 * 60 * 1000
) => {
  return rateLimit({
    windowMs,
    max: (req: Request) => {
      // Authenticated users get higher limits
      return (req as any).userId ? authenticatedMax : unauthenticatedMax;
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return (req as any).userId || req.ip || 'unknown';
    },
  });
};

