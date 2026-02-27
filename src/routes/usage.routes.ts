import { Router } from 'express';
import usageController from '../controllers/usage.controller';
import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createUsageEventSchema,
  getUsageEventsSchema,
  getUsageEventSchema,
  getUsageAggregationSchema,
  getUsageStatsSchema,
  bulkCreateUsageEventsSchema,
} from '../validators/usage.validator';

const router = Router();

// All routes require authentication
router.use(authenticateKeycloak);

/**
 * @swagger
 * /api/v1/usage-events:
 *   post:
 *     summary: Create a new usage event
 *     tags: [Usage Data]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUsageEvent'
 *     responses:
 *       201:
 *         description: Usage event created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meter or customer not found
 */
router.post('/', validate(createUsageEventSchema), usageController.createUsageEvent);

/**
 * @swagger
 * /api/v1/usage-events/bulk:
 *   post:
 *     summary: Bulk create usage events
 *     tags: [Usage Data]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - events
 *             properties:
 *               events:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CreateUsageEvent'
 *                 minItems: 1
 *                 maxItems: 1000
 *     responses:
 *       201:
 *         description: Usage events created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/bulk', validate(bulkCreateUsageEventsSchema), usageController.bulkCreateUsageEvents);

/**
 * @swagger
 * /api/v1/usage-events:
 *   get:
 *     summary: Get usage events with filtering and pagination
 *     tags: [Usage Data]
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
 *         name: meter_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by meter ID
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 1000
 *         description: Number of events to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of events to skip
 *     responses:
 *       200:
 *         description: Usage events retrieved successfully
 */
router.get('/', validate(getUsageEventsSchema), usageController.getUsageEvents);

/**
 * @swagger
 * /api/v1/usage-events/{id}:
 *   get:
 *     summary: Get a usage event by ID
 *     tags: [Usage Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Usage event ID
 *     responses:
 *       200:
 *         description: Usage event retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Usage event not found
 */
router.get('/:id', validate(getUsageEventSchema), usageController.getUsageEventById);

/**
 * @swagger
 * /api/v1/usage-data/aggregation:
 *   get:
 *     summary: Get aggregated usage data with flexible grouping
 *     tags: [Usage Data]
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
 *         name: meter_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by meter ID
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for aggregation (required)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for aggregation (required)
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: Time granularity for aggregation
 *       - in: query
 *         name: group_by
 *         schema:
 *           type: string
 *           example: "customer_id,meter_id,day"
 *         description: Comma-separated list of fields to group by
 *       - in: query
 *         name: aggregation
 *         schema:
 *           type: string
 *           enum: [sum, avg, min, max, count]
 *           default: sum
 *         description: Aggregation function to apply
 *     responses:
 *       200:
 *         description: Aggregated usage data retrieved successfully
 */
router.get('/data/aggregation', validate(getUsageAggregationSchema), usageController.getUsageAggregation);

/**
 * @swagger
 * /api/v1/usage-data/stats:
 *   get:
 *     summary: Get usage statistics and insights
 *     tags: [Usage Data]
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
 *         name: meter_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by meter ID
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for statistics
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for statistics
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *           default: month
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 */
router.get('/data/stats', validate(getUsageStatsSchema), usageController.getUsageStats);

/**
 * @swagger
 * /api/v1/usage-data/trends:
 *   get:
 *     summary: Get usage trends over time
 *     tags: [Usage Data]
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
 *         name: meter_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by meter ID
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for trends (required)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for trends (required)
 *       - in: query
 *         name: granularity
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: Time granularity for trends
 *     responses:
 *       200:
 *         description: Usage trends retrieved successfully
 */
router.get('/data/trends', usageController.getUsageTrends);

export default router;