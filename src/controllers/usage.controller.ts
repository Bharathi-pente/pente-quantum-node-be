import { Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import usageService from '../services/usage.service';
import ApiResponse, { serializeBigInt } from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Usage Data
 *   description: Usage events and aggregation APIs
 */

export class UsageController {
  /**
   * @swagger
   * /usage-events:
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
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UsageEventResponse'
   *       400:
   *         description: Bad request
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Meter or customer not found
   */
  createUsageEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
    const event = await usageService.createUsageEvent(req.user!.orgId, req.body);
    res.status(201).json(ApiResponse.success(serializeBigInt(event), 'Usage event created successfully'));
  });

  /**
   * @swagger
   * /usage-events/bulk:
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
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "100 usage events created successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     count:
   *                       type: integer
   *                       example: 100
   *       400:
   *         description: Bad request
   *       401:
   *         description: Unauthorized
   */
  bulkCreateUsageEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await usageService.bulkCreateUsageEvents(req.user!.orgId, req.body.events);
    res.status(201).json(ApiResponse.success(
      { count: result.count },
      `${result.count} usage events created successfully`
    ));
  });

  /**
   * @swagger
   * /usage-events:
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
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Usage events retrieved successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     events:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/UsageEventResponse'
   *                     total:
   *                       type: integer
   *                       example: 150
   *                     limit:
   *                       type: integer
   *                       example: 100
   *                     offset:
   *                       type: integer
   *                       example: 0
   */
  getUsageEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filters = {
      customer_id: req.query.customer_id as string,
      meter_id: req.query.meter_id as string,
      event_type: req.query.event_type as string,
      start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
      end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await usageService.getUsageEvents(req.user!.orgId, filters);
    res.json(ApiResponse.success(serializeBigInt(result), 'Usage events retrieved successfully'));
  });

  /**
   * @swagger
   * /usage-events/{id}:
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
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UsageEventResponse'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Usage event not found
   */
  getUsageEventById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const event = await usageService.getUsageEventById(req.user!.orgId, req.params.id);
    res.json(ApiResponse.success(serializeBigInt(event), 'Usage event retrieved successfully'));
  });

  /**
   * @swagger
   * /usage-data/aggregation:
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
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Aggregated usage data retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     description: Aggregation result with grouped fields and aggregated value
   */
  getUsageAggregation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filters = {
      customer_id: req.query.customer_id as string,
      meter_id: req.query.meter_id as string,
      event_type: req.query.event_type as string,
      start_date: new Date(req.query.start_date as string),
      end_date: new Date(req.query.end_date as string),
      granularity: (req.query.granularity as 'hour' | 'day' | 'week' | 'month') || 'day',
      group_by: req.query.group_by ? (req.query.group_by as string).split(',') : ['day'],
      aggregation: (req.query.aggregation as 'sum' | 'avg' | 'min' | 'max' | 'count') || 'sum',
    };

    const result = await usageService.getUsageAggregation(req.user!.orgId, filters);
    res.json(ApiResponse.success(result, 'Aggregated usage data retrieved successfully'));
  });

  /**
   * @swagger
   * /usage-data/stats:
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
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Usage statistics retrieved successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     period:
   *                       type: object
   *                       properties:
   *                         start:
   *                           type: string
   *                           format: date-time
   *                         end:
   *                           type: string
   *                           format: date-time
   *                         granularity:
   *                           type: string
   *                     summary:
   *                       type: object
   *                       properties:
   *                         total_events:
   *                           type: integer
   *                         total_volume:
   *                           type: number
   *                         average_event_value:
   *                           type: number
   *                     breakdowns:
   *                       type: object
   *                       properties:
   *                         by_event_type:
   *                           type: array
   *                           items:
   *                             type: object
   *                             properties:
   *                               event_type:
   *                                 type: string
   *                               event_count:
   *                                 type: integer
   *                               total_value:
   *                                 type: number
   *                         by_customer:
   *                           type: array
   *                           items:
   *                             type: object
   *                             properties:
   *                               customer_id:
   *                                 type: string
   *                               customer_name:
   *                                 type: string
   *                               event_count:
   *                                 type: integer
   *                               total_value:
   *                                 type: number
   *                         by_meter:
   *                           type: array
   *                           items:
   *                             type: object
   *                             properties:
   *                               meter_id:
   *                                 type: string
   *                               meter_name:
   *                                 type: string
   *                               event_count:
   *                                 type: integer
   *                               total_value:
   *                                 type: number
   */
  getUsageStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filters = {
      customer_id: req.query.customer_id as string,
      meter_id: req.query.meter_id as string,
      event_type: req.query.event_type as string,
      start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
      end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
      period: (req.query.period as 'hour' | 'day' | 'week' | 'month' | 'year') || 'month',
    };

    const result = await usageService.getUsageStats(req.user!.orgId, filters);
    res.json(ApiResponse.success(result, 'Usage statistics retrieved successfully'));
  });

  /**
   * @swagger
   * /usage-data/trends:
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
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Usage trends retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       period:
   *                         type: string
   *                         format: date-time
   *                       event_count:
   *                         type: integer
   *                       total_value:
   *                         type: number
   *                       avg_value:
   *                         type: number
   *                       min_value:
   *                         type: number
   *                       max_value:
   *                         type: number
   */
  getUsageTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filters = {
      customer_id: req.query.customer_id as string,
      meter_id: req.query.meter_id as string,
      event_type: req.query.event_type as string,
      start_date: new Date(req.query.start_date as string),
      end_date: new Date(req.query.end_date as string),
      granularity: (req.query.granularity as 'hour' | 'day' | 'week' | 'month') || 'day',
    };

    const result = await usageService.getUsageTrends(req.user!.orgId, filters);
    res.json(ApiResponse.success(result, 'Usage trends retrieved successfully'));
  });
}

export default new UsageController();