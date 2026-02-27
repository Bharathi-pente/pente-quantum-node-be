/**
 * Usage Limit CRUD Controller
 * 
 * Handles basic CRUD operations for usage limits.
 * Separated from override and tracking operations for better maintainability.
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import usageLimitService from '../services/usageLimit.service';
import ApiResponse, { serializeBigInt } from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Usage Limits
 *   description: Usage limit management for products and customers
 */

export class UsageLimitCrudController {
  /**
   * @swagger
   * /usage-limits:
   *   post:
   *     summary: Create a new usage limit
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const usageLimit = await usageLimitService.create(req.body, req.user!.orgId);
    res.status(201).json(
      ApiResponse.success(
        serializeBigInt(usageLimit), 
        'Usage limit created successfully'
      )
    );
  });

  /**
   * @swagger
   * /usage-limits:
   *   get:
   *     summary: Get all usage limits
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      product_id: req.query.product_id as string,
      meter_id: req.query.meter_id as string,
      limit_type: req.query.limit_type as string,
      period: req.query.period as string,
      status: req.query.status as string,
      customer_id: req.query.customer_id as string || req.headers['x-customer-id'] as string,
    };

    const result = await usageLimitService.findAll(
      req.user!.orgId, 
      page, 
      limit, 
      filters
    );
    
    res.json(
      ApiResponse.success(
        serializeBigInt(result), 
        'Usage limits retrieved successfully'
      )
    );
  });

  /**
   * @swagger
   * /usage-limits/{id}:
   *   get:
   *     summary: Get usage limit by ID
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const usageLimit = await usageLimitService.findById(
      req.params.id, 
      req.user!.orgId
    );
    
    res.json(
      ApiResponse.success(
        serializeBigInt(usageLimit), 
        'Usage limit retrieved successfully'
      )
    );
  });

  /**
   * @swagger
   * /usage-limits/{id}:
   *   put:
   *     summary: Update usage limit
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const usageLimit = await usageLimitService.update(
      req.params.id, 
      req.body, 
      req.user!.orgId
    );
    
    res.json(
      ApiResponse.success(
        serializeBigInt(usageLimit), 
        'Usage limit updated successfully'
      )
    );
  });

  /**
   * @swagger
   * /usage-limits/{id}:
   *   delete:
   *     summary: Delete usage limit
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await usageLimitService.delete(req.params.id, req.user!.orgId);
    res.json(ApiResponse.success(null, 'Usage limit deleted successfully'));
  });
}

export default new UsageLimitCrudController();
