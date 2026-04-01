import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import entitlementService from '../services/entitlement.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Entitlements
 *   description: Entitlement management
 */

export class EntitlementController {
  /**
   * @swagger
   * /entitlement-grants:
   *   post:
   *     summary: Create a new entitlement grant
   *     tags: [Entitlements]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - customer_id
   *               - feature_id
   *             properties:
   *               customer_id:
   *                 type: string
   *                 format: uuid
   *                 description: Customer ID
   *               feature_id:
   *                 type: string
   *                 format: uuid
   *                 description: Feature ID
   *               reason:
   *                 type: string
   *                 description: Reason for the grant
   *               expires_at:
   *                 type: string
   *                 format: date-time
   *                 description: Expiration date (optional)
   *               granted_by:
   *                 type: string
   *                 description: User who granted the entitlement
   *     responses:
   *       201:
   *         description: Entitlement grant created successfully
   */
  createGrant = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.body.org_id || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('org_id in body or x-org-id header is required'));
      return;
    }
    const grant = await entitlementService.createGrant(req.body, orgId);
    res.status(201).json(ApiResponse.success(grant, 'Entitlement grant created successfully'));
  });

  /**
   * @swagger
   * /entitlement-grants:
   *   get:
   *     summary: Get all entitlement grants
   *     tags: [Entitlements]
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
   *         name: customer_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by customer ID
   *       - in: query
   *         name: feature_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by feature ID
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, expired]
   *         description: Filter by status
   *     responses:
   *       200:
   *         description: List of entitlement grants
   */
  getAllGrants = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const filters = {
      customer_id: req.query.customer_id as string,
      feature_id: req.query.feature_id as string,
      status: req.query.status as string,
    };

    const result = await entitlementService.findAllGrants(orgId, page, limit, filters);
    res.json(ApiResponse.success(result, 'Entitlement grants retrieved successfully'));
  });

  /**
   * @swagger
   * /entitlement-grants/{id}:
   *   get:
   *     summary: Get entitlement grant by ID
   *     tags: [Entitlements]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Entitlement grant ID
   *     responses:
   *       200:
   *         description: Entitlement grant details
   */
  getGrantById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const grant = await entitlementService.findGrantById(req.params.id, orgId);
    res.json(ApiResponse.success(grant, 'Entitlement grant retrieved successfully'));
  });

  /**
   * @swagger
   * /entitlement-grants/{id}:
   *   put:
   *     summary: Update entitlement grant
   *     tags: [Entitlements]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Entitlement grant ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               customer_id:
   *                 type: string
   *                 format: uuid
   *                 description: Customer ID
   *               feature_id:
   *                 type: string
   *                 format: uuid
   *                 description: Feature ID
   *               reason:
   *                 type: string
   *                 description: Reason for the grant
   *               expires_at:
   *                 type: string
   *                 format: date-time
   *                 description: Expiration date
   *               granted_by:
   *                 type: string
   *                 description: User who granted the entitlement
   *     responses:
   *       200:
   *         description: Entitlement grant updated successfully
   */
  updateGrant = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.body.org_id || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('org_id in body or x-org-id header is required'));
      return;
    }
    const grant = await entitlementService.updateGrant(req.params.id, req.body, orgId);
    res.json(ApiResponse.success(grant, 'Entitlement grant updated successfully'));
  });

  /**
   * @swagger
   * /entitlement-grants/{id}:
   *   delete:
   *     summary: Delete entitlement grant
   *     tags: [Entitlements]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Entitlement grant ID
   *     responses:
   *       200:
   *         description: Entitlement grant deleted successfully
   */
  deleteGrant = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const result = await entitlementService.deleteGrant(req.params.id, orgId);
    res.json(ApiResponse.success(result, 'Entitlement grant deleted successfully'));
  });

  /**
   * @swagger
   * /entitlements/check:
   *   get:
   *     summary: Check customer entitlement for a feature
   *     tags: [Entitlements]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: customer_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Customer ID
   *       - in: query
   *         name: feature_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Feature ID
   *     responses:
   *       200:
   *         description: Entitlement check result
   */
  checkEntitlement = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { customer_id, feature_id } = req.query as { customer_id: string; feature_id: string };
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const result = await entitlementService.checkEntitlement(customer_id, feature_id, orgId);
    res.json(ApiResponse.success(result, 'Entitlement check completed'));
  });

  /**
   * @swagger
   * /plan-features:
   *   get:
   *     summary: Get plan features mapping
   *     tags: [Entitlements]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Plan features mapping
   */
  getPlanFeatures = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const planFeatures = await entitlementService.getPlanFeatures(orgId);
    res.json(ApiResponse.success(planFeatures, 'Plan features retrieved successfully'));
  });
}

const entitlementController = new EntitlementController();
export default entitlementController;