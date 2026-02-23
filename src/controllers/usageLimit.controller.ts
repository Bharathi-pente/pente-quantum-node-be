import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import usageLimitService from '../services/usageLimit.service';
import ApiResponse, { serializeBigInt } from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Usage Limits
 *   description: Usage limit management for products and customers
 */

export class UsageLimitController {
  // Usage Limits CRUD
  /**
   * @swagger
   * /usage-limits:
   *   post:
   *     summary: Create a new usage limit
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - product_id
   *               - meter_id
   *               - limit_type
   *               - limit_value
   *               - period
   *             properties:
   *               product_id:
   *                 type: string
   *                 format: uuid
   *                 description: Product ID
   *               meter_id:
   *                 type: string
   *                 format: uuid
   *                 description: Meter ID
   *               limit_type:
   *                 type: string
   *                 enum: [hard, soft, none]
   *                 description: Type of limit
   *               limit_value:
   *                 type: integer
   *                 minimum: 0
   *                 description: Limit value
   *               period:
   *                 type: string
   *                 enum: [monthly, daily]
   *                 description: Billing period
   *               warning_threshold_pct:
   *                 type: integer
   *                 minimum: 0
   *                 maximum: 100
   *                 description: Warning threshold percentage (default 80)
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *                 description: Status (default active)
   *     responses:
   *       201:
   *         description: Usage limit created successfully
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const usageLimit = await usageLimitService.create(req.body, req.user!.orgId);
    res.status(201).json(ApiResponse.success(serializeBigInt(usageLimit), 'Usage limit created successfully'));
  });

  /**
   * @swagger
   * /usage-limits:
   *   get:
   *     summary: Get all usage limits
   *     tags: [Usage Limits]
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
   *         name: product_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by product ID
   *       - in: query
   *         name: meter_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by meter ID
   *       - in: query
   *         name: limit_type
   *         schema:
   *           type: string
   *           enum: [hard, soft, none]
   *         description: Filter by limit type
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [monthly, daily]
   *         description: Filter by period
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive]
   *         description: Filter by status
   *     responses:
   *       200:
   *         description: List of usage limits
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
    };

    const result = await usageLimitService.findAll(req.user!.orgId, page, limit, filters);
    res.json(ApiResponse.success(serializeBigInt(result), 'Usage limits retrieved successfully'));
  });

  /**
   * @swagger
   * /usage-limits/{id}:
   *   get:
   *     summary: Get usage limit by ID
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Usage limit ID
   *     responses:
   *       200:
   *         description: Usage limit details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const usageLimit = await usageLimitService.findById(req.params.id, req.user!.orgId);
    res.json(ApiResponse.success(serializeBigInt(usageLimit), 'Usage limit retrieved successfully'));
  });

  /**
   * @swagger
   * /usage-limits/{id}:
   *   put:
   *     summary: Update usage limit
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Usage limit ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               limit_type:
   *                 type: string
   *                 enum: [hard, soft, none]
   *                 description: Type of limit
   *               limit_value:
   *                 type: integer
   *                 minimum: 0
   *                 description: Limit value
   *               period:
   *                 type: string
   *                 enum: [monthly, daily]
   *                 description: Billing period
   *               warning_threshold_pct:
   *                 type: integer
   *                 minimum: 0
   *                 maximum: 100
   *                 description: Warning threshold percentage
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *                 description: Status
   *     responses:
   *       200:
   *         description: Usage limit updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const usageLimit = await usageLimitService.update(req.params.id, req.body, req.user!.orgId);
    res.json(ApiResponse.success(serializeBigInt(usageLimit), 'Usage limit updated successfully'));
  });

  /**
   * @swagger
   * /usage-limits/{id}:
   *   delete:
   *     summary: Delete usage limit
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Usage limit ID
   *     responses:
   *       200:
   *         description: Usage limit deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await usageLimitService.delete(req.params.id, req.user!.orgId);
    res.json(ApiResponse.success(null, 'Usage limit deleted successfully'));
  });

  // Limit Overrides CRUD
  /**
   * @swagger
   * /usage-limits/overrides:
   *   post:
   *     summary: Create a new limit override
   *     tags: [Usage Limits]
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
   *               - meter_id
   *               - new_limit
   *               - reason
   *             properties:
   *               customer_id:
   *                 type: string
   *                 format: uuid
   *                 description: Customer ID
   *               meter_id:
   *                 type: string
   *                 format: uuid
   *                 description: Meter ID
   *               new_limit:
   *                 type: integer
   *                 minimum: 0
   *                 description: New limit value
   *               reason:
   *                 type: string
   *                 description: Reason for override
   *               expires_at:
   *                 type: string
   *                 format: date-time
   *                 description: Expiration date (optional)
   *     responses:
   *       201:
   *         description: Limit override created successfully
   */
  createOverride = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limitOverride = await usageLimitService.createOverride(req.body, req.user!.orgId);
    res.status(201).json(ApiResponse.success(limitOverride, 'Limit override created successfully'));
  });

  /**
   * @swagger
   * /usage-limits/overrides:
   *   get:
   *     summary: Get all limit overrides
   *     tags: [Usage Limits]
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
   *         name: meter_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by meter ID
   *       - in: query
   *         name: active_only
   *         schema:
   *           type: boolean
   *           default: true
   *         description: Show only active overrides
   *     responses:
   *       200:
   *         description: List of limit overrides
   */
  getAllOverrides = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      customer_id: req.query.customer_id as string,
      meter_id: req.query.meter_id as string,
      active_only: req.query.active_only === 'false' ? false : true,
    };

    const result = await usageLimitService.findAllOverrides(req.user!.orgId, page, limit, filters);
    res.json(ApiResponse.success(serializeBigInt(result), 'Limit overrides retrieved successfully'));
  });

  /**
   * @swagger
   * /usage-limits/overrides/{id}:
   *   get:
   *     summary: Get limit override by ID
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Limit override ID
   *     responses:
   *       200:
   *         description: Limit override details
   */
  getOverrideById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limitOverride = await usageLimitService.findOverrideById(req.params.id, req.user!.orgId);
    res.json(ApiResponse.success(limitOverride, 'Limit override retrieved successfully'));
  });

  /**
   * @swagger
   * /usage-limits/overrides/{id}:
   *   put:
   *     summary: Update limit override
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Limit override ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               new_limit:
   *                 type: integer
   *                 minimum: 0
   *                 description: New limit value
   *               reason:
   *                 type: string
   *                 description: Reason for override
   *               expires_at:
   *                 type: string
   *                 format: date-time
   *                 description: Expiration date
   *     responses:
   *       200:
   *         description: Limit override updated successfully
   */
  updateOverride = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limitOverride = await usageLimitService.updateOverride(req.params.id, req.body, req.user!.orgId);
    res.json(ApiResponse.success(limitOverride, 'Limit override updated successfully'));
  });

  /**
   * @swagger
   * /usage-limits/overrides/{id}:
   *   delete:
   *     summary: Delete limit override
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Limit override ID
   *     responses:
   *       200:
   *         description: Limit override deleted successfully
   */
  deleteOverride = asyncHandler(async (req: AuthRequest, res: Response) => {
    await usageLimitService.deleteOverride(req.params.id, req.user!.orgId);
    res.json(ApiResponse.success(null, 'Limit override deleted successfully'));
  });

  /**
   * @swagger
   * /usage-limits/current-usage:
   *   get:
   *     summary: Get current usage data for all limits
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: customer_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by customer ID
   *       - in: query
   *         name: product_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by product ID
   *       - in: query
   *         name: meter_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by meter ID
   *     responses:
   *       200:
   *         description: Current usage data retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       limit_id:
   *                         type: string
   *                         format: uuid
   *                       customer_id:
   *                         type: string
   *                         format: uuid
   *                       product_id:
   *                         type: string
   *                         format: uuid
   *                       meter_id:
   *                         type: string
   *                         format: uuid
   *                       current_usage:
   *                         type: integer
   *                       limit_value:
   *                         type: integer
   *                       usage_percentage:
   *                         type: number
   *                         format: float
   *                       status:
   *                         type: string
   *                         enum: [normal, warning, exceeded]
   *                       period_start:
   *                         type: string
   *                         format: date-time
   *                       period_end:
   *                         type: string
   *                         format: date-time
   *                 message:
   *                   type: string
   *                   example: "Current usage data retrieved successfully"
   */
  getCurrentUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filters = {
      customer_id: req.query.customer_id as string,
      product_id: req.query.product_id as string,
      meter_id: req.query.meter_id as string,
    };

    const usageData = await usageLimitService.getCurrentUsage(req.user!.orgId, filters);
    res.json(ApiResponse.success(usageData, 'Current usage data retrieved successfully'));
  });

  /**
   * @swagger
   * /usage-limits/{id}/current-usage:
   *   get:
   *     summary: Get current usage for a specific limit
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Usage limit ID
   *     responses:
   *       200:
   *         description: Current usage for limit retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     limit_id:
   *                       type: string
   *                       format: uuid
   *                     current_usage:
   *                       type: integer
   *                     limit_value:
   *                       type: integer
   *                     usage_percentage:
   *                       type: number
   *                       format: float
   *                     status:
   *                       type: string
   *                       enum: [normal, warning, exceeded]
   *                     period_start:
   *                       type: string
   *                       format: date-time
   *                     period_end:
   *                       type: string
   *                       format: date-time
   *                     warning_threshold:
   *                       type: integer
   *                     time_remaining:
   *                       type: string
   *                       description: "Time remaining in current period"
   *                 message:
   *                   type: string
   *                   example: "Current usage for limit retrieved successfully"
   */
  getLimitCurrentUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const usageData = await usageLimitService.getLimitCurrentUsage(req.params.id, req.user!.orgId);
    res.json(ApiResponse.success(usageData, 'Current usage for limit retrieved successfully'));
  });

  /**
   * @swagger
   * /usage-limits/usage-stats:
   *   get:
   *     summary: Get usage statistics and analytics
   *     tags: [Usage Limits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: customer_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by customer ID
   *       - in: query
   *         name: product_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by product ID
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [daily, monthly, yearly]
   *           default: monthly
   *         description: Time period for statistics
   *     responses:
   *       200:
   *         description: Usage statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     total_limits:
   *                       type: integer
   *                     active_limits:
   *                       type: integer
   *                     limits_at_warning:
   *                       type: integer
   *                     limits_exceeded:
   *                       type: integer
   *                     average_usage_percentage:
   *                       type: number
   *                       format: float
   *                     top_usage_limits:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           limit_id:
   *                             type: string
   *                             format: uuid
   *                           usage_percentage:
   *                             type: number
   *                             format: float
   *                           customer_name:
   *                             type: string
   *                           product_name:
   *                             type: string
   *                 message:
   *                   type: string
   *                   example: "Usage statistics retrieved successfully"
   */
  getUsageStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filters = {
      customer_id: req.query.customer_id as string,
      product_id: req.query.product_id as string,
      period: req.query.period as string || 'monthly',
    };

    const stats = await usageLimitService.getUsageStats(req.user!.orgId, filters);
    res.json(ApiResponse.success(stats, 'Usage statistics retrieved successfully'));
  });
}

export default new UsageLimitController();