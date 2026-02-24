/**
 * Monitoring Controller
 * 
 * Provides endpoints for monitoring application health and performance
 */

import { Request, Response } from 'express';
import { getPerformanceMetrics, getRecentMetrics } from '../middleware/performance.middleware';
import CacheService from '../config/redis';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';

/**
 * Get performance metrics
 */
export const getMetrics = asyncHandler(async (_req: Request, res: Response) => {
  const metrics = getPerformanceMetrics();
  res.json(ApiResponse.success(metrics, 'Performance metrics retrieved'));
});

/**
 * Get recent request metrics
 */
export const getRecentRequests = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const metrics = getRecentMetrics(limit);
  res.json(ApiResponse.success(metrics, 'Recent requests retrieved'));
});

/**
 * Get system health
 */
export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    },
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    },
    process: {
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
    },
  };

  res.json(ApiResponse.success(health, 'System health retrieved'));
});

/**
 * Clear cache
 */
export const clearCache = asyncHandler(async (_req: Request, res: Response) => {
  await CacheService.clear();
  res.json(ApiResponse.success(null, 'Cache cleared successfully'));
});

export default {
  getMetrics,
  getRecentRequests,
  getHealth,
  clearCache,
};
