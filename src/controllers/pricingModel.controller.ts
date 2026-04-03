import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import pricingModelService from '../services/pricingModel.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Pricing Models
 *   description: Pricing model management for billing
 */

export class PricingModelController {
  /**
   * @swagger
   * /pricing-models:
   *   post:
   *     summary: Create a new pricing model
   *     tags: [Pricing Models]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - pricing_type
   *               - meter_id
   *               - unit_label
   *             properties:
   *               name:
   *                 type: string
   *                 description: Pricing model name
   *               pricing_type:
   *                 type: string
   *                 enum: [per_unit, tiered, volume, package]
   *                 description: Type of pricing
   *               meter_id:
   *                 type: string
   *                 format: uuid
   *                 description: Associated meter ID
   *               unit_price:
   *                 type: number
   *                 description: Price per unit (nullable for tiered)
   *               unit_label:
   *                 type: string
   *                 description: Unit label (e.g. per token, per call)
   *               status:
   *                 type: string
   *                 enum: [active, draft, archived]
   *                 description: Pricing model status (optional)
   *     responses:
   *       201:
   *         description: Pricing model created successfully
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.params.orgId || req.body.org_id || req.headers['x-org-id'] as string || req.query.orgId as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId in body, x-org-id header, params.orgId, or orgId query parameter is required'));
      return;
    }
    const pricingModel = await pricingModelService.create(req.body, orgId, req.user!.id);
    res.status(201).json(ApiResponse.success(pricingModel, 'Pricing model created successfully'));
  });

  /**
   * @swagger
   * /pricing-models:
   *   get:
   *     summary: Get all pricing models
   *     tags: [Pricing Models]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by name or unit label
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, draft, archived]
   *         description: Filter by status
   *       - in: query
   *         name: pricing_type
   *         schema:
   *           type: string
   *           enum: [per_unit, tiered, volume, package]
   *         description: Filter by pricing type
   *       - in: query
   *         name: meter_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by meter ID
   *     responses:
   *       200:
   *         description: List of pricing models
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const orgId = req.params.orgId || req.params.id || req.query.orgId as string || req.headers['x-org-id'] as string || req.user?.orgId;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter, x-org-id header, params.orgId, params.id, or user orgId is required'));
      return;
    }
    const filters = {
      search: req.query.search as string,
      status: req.query.status as string,
      pricing_type: req.query.pricing_type as string,
      meter_id: req.query.meter_id as string,
    };

    const result = await pricingModelService.findAll(orgId, page, limit, filters);
    res.json(ApiResponse.success(result, 'Pricing models retrieved successfully'));
  });

  /**
   * @swagger
   * /pricing-models/{id}:
   *   get:
   *     summary: Get pricing model by ID
   *     tags: [Pricing Models]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Pricing model ID
   *     responses:
   *       200:
   *         description: Pricing model details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.params.orgId || req.query.orgId as string || req.headers['x-org-id'] as string || req.user?.orgId;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter, x-org-id header, params.orgId, or user orgId is required'));
      return;
    }
    const pricingModel = await pricingModelService.findById(req.params.id, orgId);
    res.json(ApiResponse.success(pricingModel, 'Pricing model retrieved successfully'));
  });

  /**
   * @swagger
   * /pricing-models/{id}:
   *   put:
   *     summary: Update pricing model
   *     tags: [Pricing Models]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Pricing model ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Pricing model name
   *               pricing_type:
   *                 type: string
   *                 enum: [per_unit, tiered, volume, package]
   *                 description: Type of pricing
   *               meter_id:
   *                 type: string
   *                 format: uuid
   *                 description: Associated meter ID
   *               unit_price:
   *                 type: number
   *                 description: Price per unit
   *               unit_label:
   *                 type: string
   *                 description: Unit label
   *               status:
   *                 type: string
   *                 enum: [active, draft, archived]
   *                 description: Pricing model status
   *     responses:
   *       200:
   *         description: Pricing model updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.params.orgId || req.params.id || req.query.orgId as string || req.headers['x-org-id'] as string || req.user?.orgId;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId in body, x-org-id header, params.orgId, params.id, or user orgId is required'));
      return;
    }
    const pricingModel = await pricingModelService.update(req.params.id, req.body, orgId);
    res.json(ApiResponse.success(pricingModel, 'Pricing model updated successfully'));
  });

  /**
   * @swagger
   * /pricing-models/{id}:
   *   delete:
   *     summary: Delete pricing model
   *     tags: [Pricing Models]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Pricing model ID
   *     responses:
   *       200:
   *         description: Pricing model deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.params.orgId || req.params.id || req.query.orgId as string || req.headers['x-org-id'] as string || req.user?.orgId;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter, x-org-id header, params.orgId, params.id, or user orgId is required'));
      return;
    }
    await pricingModelService.delete(req.params.id, orgId);
    res.json(ApiResponse.success(null, 'Pricing model deleted successfully'));
  });
}

export default new PricingModelController();