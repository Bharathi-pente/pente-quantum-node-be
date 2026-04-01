import { Router } from 'express';
import usageLimitController from '../controllers/usageLimit.controller';
// import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createUsageLimitSchema,
  updateUsageLimitSchema,
  getUsageLimitSchema,
  getUsageLimitsQuerySchema,
  createLimitOverrideSchema,
  updateLimitOverrideSchema,
  getLimitOverrideSchema,
  getLimitOverridesQuerySchema,
  getCurrentUsageQuerySchema,
  getUsageStatsQuerySchema,
} from '../validators/usageLimit.validator';

const router = Router();

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
 *             $ref: '#/components/schemas/CreateUsageLimit'
 *     responses:
 *       201:
 *         description: Usage limit created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsageLimitResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product or meter not found
 *       409:
 *         description: Usage limit already exists for this combination
 */
router.post('/', validate(createUsageLimitSchema), usageLimitController.create);

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
 *                     usageLimits:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UsageLimit'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                 message:
 *                   type: string
 *                   example: "Usage limits retrieved successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', validate(getUsageLimitsQuerySchema), usageLimitController.getAll);

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsageLimitResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Usage limit not found
 */
router.get('/:id([0-9a-fA-F-]{36})', validate(getUsageLimitSchema), usageLimitController.getById);

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
 *             $ref: '#/components/schemas/UpdateUsageLimit'
 *     responses:
 *       200:
 *         description: Usage limit updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsageLimitResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Usage limit not found
 */
router.put('/:id([0-9a-fA-F-]{36})', validate(updateUsageLimitSchema), usageLimitController.update);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: null
 *                 message:
 *                   type: string
 *                   example: "Usage limit deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Usage limit not found
 */
router.delete('/:id([0-9a-fA-F-]{36})', usageLimitController.delete);

// Limit Overrides Routes
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
 *             $ref: '#/components/schemas/CreateLimitOverride'
 *     responses:
 *       201:
 *         description: Limit override created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LimitOverrideResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Customer or meter not found
 */
router.post('/overrides', validate(createLimitOverrideSchema), usageLimitController.createOverride);

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
 *                     limitOverrides:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LimitOverride'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                 message:
 *                   type: string
 *                   example: "Limit overrides retrieved successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/overrides', validate(getLimitOverridesQuerySchema), usageLimitController.getAllOverrides);

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LimitOverrideResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Limit override not found
 */
router.get('/overrides/:id', validate(getLimitOverrideSchema), usageLimitController.getOverrideById);

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
 *             $ref: '#/components/schemas/UpdateLimitOverride'
 *     responses:
 *       200:
 *         description: Limit override updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LimitOverrideResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Limit override not found
 */
router.put('/overrides/:id', validate(updateLimitOverrideSchema), usageLimitController.updateOverride);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: null
 *                 message:
 *                   type: string
 *                   example: "Limit override deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Limit override not found
 */
router.delete('/overrides/:id', usageLimitController.deleteOverride);

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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/current-usage', validate(getCurrentUsageQuerySchema), usageLimitController.getCurrentUsage);

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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Usage limit not found
 */
router.get('/:id([0-9a-fA-F-]{36})/current-usage', validate(getUsageLimitSchema), usageLimitController.getLimitCurrentUsage);

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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/usage-stats', validate(getUsageStatsQuerySchema), usageLimitController.getUsageStats);

export default router;
