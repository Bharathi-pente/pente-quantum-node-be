/**
 * Usage Limit Tracking Controller
 * 
 * Handles usage tracking, monitoring, and statistics.
 * Separated from CRUD and override operations for better code organization.
 */

import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import usageLimitService from '../services/usageLimit.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Usage Limit Tracking
 *   description: Usage tracking and monitoring
 */

export class UsageLimitTrackingController {
  /**
   * @swagger
   * /usage-limits/current-usage:
   *   get:
   *     summary: Get current usage data for all limits
   *     tags: [Usage Limit Tracking]
   *     security:
   *       - bearerAuth: []
   */
  getCurrentUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filters = {
      customer_id: req.query.customer_id as string,
      product_id: req.query.product_id as string,
      meter_id: req.query.meter_id as string,
    };

    const usageData = await usageLimitService.getCurrentUsage(
      req.user!.orgId, 
      filters
    );
    
    res.json(
      ApiResponse.success(
        usageData, 
        'Current usage data retrieved successfully'
      )
    );
  });

  /**
   * @swagger
   * /usage-limits/{id}/current-usage:
   *   get:
   *     summary: Get current usage for a specific limit
   *     tags: [Usage Limit Tracking]
   *     security:
   *       - bearerAuth: []
   */
  getLimitUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const usageData = await usageLimitService.getLimitCurrentUsage(
      req.params.id, 
      req.user!.orgId
    );
    
    res.json(
      ApiResponse.success(
        usageData, 
        'Current usage for limit retrieved successfully'
      )
    );
  });

  /**
   * @swagger
   * /usage-limits/usage-stats:
   *   get:
   *     summary: Get usage statistics and analytics
   *     tags: [Usage Limit Tracking]
   *     security:
   *       - bearerAuth: []
   */
  getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filters = {
      customer_id: req.query.customer_id as string,
      product_id: req.query.product_id as string,
      period: req.query.period as string || 'monthly',
    };

    const stats = await usageLimitService.getUsageStats(
      req.user!.orgId, 
      filters
    );
    
    res.json(
      ApiResponse.success(
        stats, 
        'Usage statistics retrieved successfully'
      )
    );
  });
}

export default new UsageLimitTrackingController();
