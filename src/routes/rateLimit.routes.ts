import { Router } from 'express';
import rateLimitController from '../controllers/rateLimit.controller';
import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createRateLimitPolicySchema,
  updateRateLimitPolicySchema,
  getRateLimitPolicySchema,
  getRateLimitPoliciesQuerySchema,
} from '../validators/rateLimit.validator';

const router = Router();

// All routes require authentication
router.use(authenticateKeycloak);

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
 *             $ref: '#/components/schemas/CreateRateLimitPolicy'
 *     responses:
 *       201:
 *         description: Policy created successfully
 */
router.post('/', validate(createRateLimitPolicySchema), rateLimitController.create);

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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of rate limit policies
 */
router.get('/', validate(getRateLimitPoliciesQuerySchema), rateLimitController.getAll);

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
 *     responses:
 *       200:
 *         description: Policy details
 */
router.get('/:id', validate(getRateLimitPolicySchema), rateLimitController.getById);

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRateLimitPolicy'
 *     responses:
 *       200:
 *         description: Policy updated successfully
 */
router.put('/:id', validate(updateRateLimitPolicySchema), rateLimitController.update);

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
 *     responses:
 *       200:
 *         description: Policy deleted successfully
 */
router.delete('/:id', validate(getRateLimitPolicySchema), rateLimitController.delete);

export default router;
