import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import featureService from '../services/feature.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Features
 *   description: Feature management
 */

export class FeatureController {
  /**
   * @swagger
   * /features:
   *   post:
   *     summary: Create a new feature
   *     tags: [Features]
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
   *               - category
   *             properties:
   *               name:
   *                 type: string
   *                 description: Feature name
   *               description:
   *                 type: string
   *                 description: Feature description
   *               category:
   *                 type: string
   *                 enum: [core, security, ai, integration, support]
   *                 description: Feature category
   *               status:
   *                 type: string
   *                 enum: [active, deprecated]
   *                 description: Feature status (optional)
   *     responses:
   *       201:
   *         description: Feature created successfully
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.body.org_id || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('org_id in body or x-org-id header is required'));
      return;
    }
    const feature = await featureService.create(req.body, orgId);
    res.status(201).json(ApiResponse.success(feature, 'Feature created successfully'));
  });

  /**
   * @swagger
   * /features:
   *   get:
   *     summary: Get all features
   *     tags: [Features]
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
   *         description: Search by name or description
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, deprecated]
   *         description: Filter by status
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [core, security, ai, integration, support]
   *         description: Filter by category
   *     responses:
   *       200:
   *         description: List of features
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const filters = {
      search: req.query.search as string,
      status: req.query.status as string,
      category: req.query.category as string,
    };

    const result = await featureService.findAll(orgId, page, limit, filters);
    res.json(ApiResponse.success(result, 'Features retrieved successfully'));
  });

  /**
   * @swagger
   * /features/{id}:
   *   get:
   *     summary: Get feature by ID
   *     tags: [Features]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Feature ID
   *     responses:
   *       200:
   *         description: Feature details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const feature = await featureService.findById(req.params.id, orgId);
    res.json(ApiResponse.success(feature, 'Feature retrieved successfully'));
  });

  /**
   * @swagger
   * /features/{id}:
   *   put:
   *     summary: Update feature
   *     tags: [Features]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Feature ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Feature name
   *               description:
   *                 type: string
   *                 description: Feature description
   *               category:
   *                 type: string
   *                 enum: [core, security, ai, integration, support]
   *                 description: Feature category
   *               status:
   *                 type: string
   *                 enum: [active, deprecated]
   *                 description: Feature status
   *     responses:
   *       200:
   *         description: Feature updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.body.org_id || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('org_id in body or x-org-id header is required'));
      return;
    }
    const feature = await featureService.update(req.params.id, req.body, orgId);
    res.json(ApiResponse.success(feature, 'Feature updated successfully'));
  });

  /**
   * @swagger
   * /features/{id}:
   *   delete:
   *     summary: Delete feature
   *     tags: [Features]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Feature ID
   *     responses:
   *       200:
   *         description: Feature deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    await featureService.delete(req.params.id, orgId);
    res.json(ApiResponse.success(null, 'Feature deleted successfully'));
  });
}

export default new FeatureController();