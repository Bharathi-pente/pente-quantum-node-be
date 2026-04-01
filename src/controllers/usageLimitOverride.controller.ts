/**
 * Usage Limit Override Controller
 * 
 * Handles customer-specific limit overrides.
 * Separated from main CRUD operations for better code organization.
 */

import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import usageLimitService from '../services/usageLimit.service';
import ApiResponse, { serializeBigInt } from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Usage Limit Overrides
 *   description: Customer-specific limit override management
 */

export class UsageLimitOverrideController {
  /**
   * @swagger
   * /usage-limits/overrides:
   *   post:
   *     summary: Create a new limit override
   *     tags: [Usage Limit Overrides]
   *     security:
   *       - bearerAuth: []
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.body.org_id || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('org_id in body or x-org-id header is required'));
      return;
    }
    const limitOverride = await usageLimitService.createOverride(
      req.body, 
      orgId
    );
    
    res.status(201).json(
      ApiResponse.success(
        limitOverride, 
        'Limit override created successfully'
      )
    );
  });

  /**
   * @swagger
   * /usage-limits/overrides:
   *   get:
   *     summary: Get all limit overrides
   *     tags: [Usage Limit Overrides]
   *     security:
   *       - bearerAuth: []
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      customer_id: req.query.customer_id as string,
      meter_id: req.query.meter_id as string,
      active_only: req.query.active_only === 'false' ? false : true,
    };

    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }

    const result = await usageLimitService.findAllOverrides(
      orgId, 
      page, 
      limit, 
      filters
    );
    
    res.json(
      ApiResponse.success(
        serializeBigInt(result), 
        'Limit overrides retrieved successfully'
      )
    );
  });

  /**
   * @swagger
   * /usage-limits/overrides/{id}:
   *   get:
   *     summary: Get limit override by ID
   *     tags: [Usage Limit Overrides]
   *     security:
   *       - bearerAuth: []
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const limitOverride = await usageLimitService.findOverrideById(
      req.params.id, 
      orgId
    );
    
    res.json(
      ApiResponse.success(
        limitOverride, 
        'Limit override retrieved successfully'
      )
    );
  });

  /**
   * @swagger
   * /usage-limits/overrides/{id}:
   *   put:
   *     summary: Update limit override
   *     tags: [Usage Limit Overrides]
   *     security:
   *       - bearerAuth: []
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.body.org_id || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('org_id in body or x-org-id header is required'));
      return;
    }
    const limitOverride = await usageLimitService.updateOverride(
      req.params.id, 
      req.body, 
      orgId
    );
    
    res.json(
      ApiResponse.success(
        limitOverride, 
        'Limit override updated successfully'
      )
    );
  });

  /**
   * @swagger
   * /usage-limits/overrides/{id}:
   *   delete:
   *     summary: Delete limit override
   *     tags: [Usage Limit Overrides]
   *     security:
   *       - bearerAuth: []
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    await usageLimitService.deleteOverride(req.params.id, orgId);
    res.json(ApiResponse.success(null, 'Limit override deleted successfully'));
  });
}

export default new UsageLimitOverrideController();
