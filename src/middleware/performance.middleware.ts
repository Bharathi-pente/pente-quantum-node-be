/**
 * Performance Monitoring Middleware
 * 
 * Tracks request/response times, memory usage, and performance metrics
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

interface PerformanceMetrics {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  userAgent?: string;
  ip?: string;
}

// Store metrics in memory (could be sent to external service)
const metrics: PerformanceMetrics[] = [];
const MAX_METRICS = 1000;

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to capture metrics
  res.end = function(this: Response, ...args: any[]): Response {
    const responseTime = Date.now() - startTime;
    const endMemory = process.memoryUsage();

    // Calculate memory delta
    const memoryDelta: NodeJS.MemoryUsage = {
      rss: endMemory.rss - startMemory.rss,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
      arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
    };

    const metric: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      memoryUsage: memoryDelta,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    };

    // Store metric
    metrics.push(metric);
    if (metrics.length > MAX_METRICS) {
      metrics.shift();
    }

    // Log slow requests (>1000ms)
    if (responseTime > 1000) {
      logger.warn(`[Performance] Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`);
    }

    // Log high memory usage (>50MB)
    if (memoryDelta.heapUsed > 50 * 1024 * 1024) {
      logger.warn(`[Performance] High memory usage: ${req.method} ${req.path} - ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }

    // Call original end
    return originalEnd.apply(this, args as any);
  };

  next();
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = () => {
  const now = Date.now();
  const last5Min = metrics.filter(m => now - new Date(m.timestamp).getTime() < 5 * 60 * 1000);

  if (last5Min.length === 0) {
    return {
      averageResponseTime: 0,
      totalRequests: 0,
      slowRequests: 0,
      errorRate: 0,
      requestsPerMinute: 0,
    };
  }

  const totalResponseTime = last5Min.reduce((sum, m) => sum + m.responseTime, 0);
  const slowRequests = last5Min.filter(m => m.responseTime > 1000).length;
  const errorRequests = last5Min.filter(m => m.statusCode >= 400).length;

  return {
    averageResponseTime: Math.round(totalResponseTime / last5Min.length),
    totalRequests: last5Min.length,
    slowRequests,
    errorRate: Math.round((errorRequests / last5Min.length) * 100),
    requestsPerMinute: Math.round(last5Min.length / 5),
    memoryUsage: process.memoryUsage(),
  };
};

/**
 * Get recent metrics
 */
export const getRecentMetrics = (limit: number = 100) => {
  return metrics.slice(-limit);
};

/**
 * Clear metrics
 */
export const clearMetrics = () => {
  metrics.length = 0;
};
