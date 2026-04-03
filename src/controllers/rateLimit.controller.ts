import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import rateLimitService from '../services/rateLimit.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Rate Limits
 *   description: Rate limit policy management
 */

export class RateLimitController {
  /**
   * @swagger
   * /rate-limit-policies:
   *   post:
   *     summary: Create a new rate limit policy
   *     tags: [Rate Limits]
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
   *               - product_id
   *             properties:
   *               name:
   *                 type: string
   *                 description: Policy name
   *               product_id:
   *                 type: string
   *                 format: uuid
   *                 description: Product ID
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *                 description: Policy status
   *               rules:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     endpoint:
   *                       type: string
   *                     requests_limit:
   *                       type: number
   *                     time_window:
   *                       type: string
   *                     burst_limit:
   *                       type: number
   *     responses:
   *       201:
   *         description: Policy created successfully
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json(ApiResponse.error('Authentication required'));
      return;
    }

    const policy = await rateLimitService.create(req.body, req.user);
    res.status(201).json(ApiResponse.success(policy, 'Rate limit policy created successfully'));
  });

  /**
   * @swagger
   * /rate-limit-policies:
   *   get:
   *     summary: Get all rate limit policies
   *     tags: [Rate Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Items per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive]
   *         description: Filter by status
   *       - in: query
   *         name: product_id
   *         schema:
   *           type: string
   *         description: Filter by product ID
   *     responses:
   *       200:
   *         description: List of rate limit policies
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json(ApiResponse.error('Authentication required'));
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      status: req.query.status as string,
      product_id: req.query.product_id as string,
    };

    const { policies, total } = await rateLimitService.findAll(req.user, page, limit, filters);
    res.json(ApiResponse.paginated(policies, page, limit, total));
  });

  /**
   * @swagger
   * /rate-limit-policies/{id}:
   *   get:
   *     summary: Get rate limit policy by ID
   *     tags: [Rate Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Policy ID
   *     responses:
   *       200:
   *         description: Policy details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json(ApiResponse.error('Authentication required'));
      return;
    }

    const policy = await rateLimitService.findById(req.params.id, req.user);
    res.json(ApiResponse.success(policy));
  });

  /**
   * @swagger
   * /rate-limit-policies/{id}:
   *   put:
   *     summary: Update a rate limit policy
   *     tags: [Rate Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Policy ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *               rules:
   *                 type: array
   *                 items:
   *                   type: object
   *     responses:
   *       200:
   *         description: Policy updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json(ApiResponse.error('Authentication required'));
      return;
    }

    const policy = await rateLimitService.update(req.params.id, req.body, req.user);
    res.json(ApiResponse.success(policy, 'Rate limit policy updated successfully'));
  });

  /**
   * @swagger
   * /rate-limit-policies/{id}:
   *   delete:
   *     summary: Delete a rate limit policy
   *     tags: [Rate Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Policy ID
   *     responses:
   *       200:
   *         description: Policy deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json(ApiResponse.error('Authentication required'));
      return;
    }

    await rateLimitService.delete(req.params.id, req.user);
    res.json(ApiResponse.success(null, 'Rate limit policy deleted successfully'));
  });

  /**
   * @swagger
   * /rate-limit-policies/metrics:
   *   get:
   *     summary: Get rate limit metrics and monitoring data
   *     tags: [Rate Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: start_date
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for metrics (YYYY-MM-DD)
   *       - in: query
   *         name: end_date
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for metrics (YYYY-MM-DD)
   *       - in: query
   *         name: product_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by product ID
   *     responses:
   *       200:
   *         description: Rate limit metrics retrieved successfully
   */
  getMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    const isSuperAdmin = req.user?.roles?.includes('super_admin') ?? false;

    if (!orgId && !isSuperAdmin) {
      res.status(403).json(ApiResponse.error('Organization access required for rate limit metrics'));
      return;
    }

    // TODO: Implement real metrics calculation from database/logs using req.query filters
    // const { start_date, end_date, product_id } = req.query;
    // const orgId = req.user!.orgId;

    // For now, return mock metrics data
    const metrics = {
      totalRequests: 125000,
      blockedRequests: 1250,
      averageResponseTime: 245,
      throughputPerSecond: 1250,
      topEndpoints: [
        { endpoint: '/api/customers', requests: 45000, blocked: 450 },
        { endpoint: '/api/invoices', requests: 35000, blocked: 350 },
        { endpoint: '/api/payments', requests: 25000, blocked: 250 },
        { endpoint: '/api/products', requests: 20000, blocked: 200 }
      ],
      hourlyData: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        requests: Math.floor(Math.random() * 5000) + 1000,
        blocked: Math.floor(Math.random() * 100) + 10
      })),
      policyPerformance: [
        { policyName: 'API Rate Limit', requests: 75000, blocked: 750, efficiency: 99.0 },
        { policyName: 'User Rate Limit', requests: 35000, blocked: 350, efficiency: 99.0 },
        { policyName: 'Organization Rate Limit', requests: 15000, blocked: 150, efficiency: 99.0 }
      ]
    };

    res.json(ApiResponse.success(metrics));
  });

  /**
   * @swagger
   * /products/{productId}/rate-limit-policies:
   *   get:
   *     summary: Get all policies for a product
   *     tags: [Rate Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *         description: Product ID
   *     responses:
   *       200:
   *         description: List of policies for the product
   */
  getByProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json(ApiResponse.error('Authentication required'));
      return;
    }

    const policies = await rateLimitService.findByProduct(req.params.productId, req.user);
    res.json(ApiResponse.success(policies));
  });
}

export default new RateLimitController();
