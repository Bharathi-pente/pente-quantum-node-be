import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import meterService from '../services/meter.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Meters
 *   description: Meter management for usage tracking
 */

export class MeterController {
  /**
   * @swagger
   * /meters:
   *   post:
   *     summary: Create a new meter
   *     tags: [Meters]
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
   *               - event_type
   *               - aggregation
   *               - field
   *             properties:
   *               name:
   *                 type: string
   *                 description: Meter name
   *                 example: "API Usage Meter"
   *               event_type:
   *                 type: string
   *                 description: Event type (e.g. llm.inference)
   *                 example: "llm.inference"
   *               aggregation:
   *                 type: string
   *                 enum: [SUM, COUNT, MAX, AVG]
   *                 description: Aggregation method
   *                 example: "SUM"
   *               field:
   *                 type: string
   *                 description: Field to aggregate (e.g. input_tokens)
   *                 example: "input_tokens"
   *               status:
   *                 type: string
   *                 enum: [active, draft, archived]
   *                 description: Meter status (optional)
   *                 example: "active"
   *           example:
   *             name: "API Usage Meter"
   *             event_type: "llm.inference"
   *             aggregation: "SUM"
   *             field: "input_tokens"
   *             status: "active"
   *     responses:
   *       201:
   *         description: Meter created successfully
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const meter = await meterService.create(req.body, req.user!.orgId);
    res.status(201).json(ApiResponse.success(meter, 'Meter created successfully'));
  });

  /**
   * @swagger
   * /meters:
   *   get:
   *     summary: Get all meters
   *     tags: [Meters]
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
   *         description: Search by name, event_type, or field
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, draft, archived]
   *         description: Filter by status
   *       - in: query
   *         name: event_type
   *         schema:
   *           type: string
   *         description: Filter by event type
   *       - in: query
   *         name: aggregation
   *         schema:
   *           type: string
   *           enum: [SUM, COUNT, MAX, AVG]
   *         description: Filter by aggregation
   *     responses:
   *       200:
   *         description: List of meters
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      search: req.query.search as string,
      status: req.query.status as string,
      event_type: req.query.event_type as string,
      aggregation: req.query.aggregation as string,
    };

    const result = await meterService.findAll(req.user!.orgId, page, limit, filters);
    res.json(ApiResponse.success(result, 'Meters retrieved successfully'));
  });

  /**
   * @swagger
   * /meters/{id}:
   *   get:
   *     summary: Get meter by ID
   *     tags: [Meters]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Meter ID
   *     responses:
   *       200:
   *         description: Meter details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const meter = await meterService.findById(req.params.id, req.user!.orgId);
    res.json(ApiResponse.success(meter, 'Meter retrieved successfully'));
  });

  /**
   * @swagger
   * /meters/{id}:
   *   put:
   *     summary: Update meter
   *     tags: [Meters]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Meter ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Meter name
   *               event_type:
   *                 type: string
   *                 description: Event type
   *               aggregation:
   *                 type: string
   *                 enum: [SUM, COUNT, MAX, AVG]
   *                 description: Aggregation method
   *               field:
   *                 type: string
   *                 description: Field to aggregate
   *               status:
   *                 type: string
   *                 enum: [active, draft, archived]
   *                 description: Meter status
   *     responses:
   *       200:
   *         description: Meter updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const meter = await meterService.update(req.params.id, req.body, req.user!.orgId);
    res.json(ApiResponse.success(meter, 'Meter updated successfully'));
  });

  /**
   * @swagger
   * /meters/{id}:
   *   delete:
   *     summary: Delete meter
   *     tags: [Meters]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Meter ID
   *     responses:
   *       200:
   *         description: Meter deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await meterService.delete(req.params.id, req.user!.orgId);
    res.json(ApiResponse.success(null, 'Meter deleted successfully'));
  });

  /**
   * @swagger
   * /meters/{id}/realtime-readings:
   *   get:
   *     summary: Get real-time meter readings
   *     tags: [Meters]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Meter ID
   *       - in: query
   *         name: timeframe
   *         schema:
   *           type: string
   *           enum: [1h, 24h, 7d, 30d]
   *           default: 24h
   *         description: Timeframe for readings
   *       - in: query
   *         name: granularity
   *         schema:
   *           type: string
   *           enum: [minute, hour, day]
   *           default: hour
   *         description: Data granularity
   *     responses:
   *       200:
   *         description: Real-time meter readings retrieved successfully
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
   *                     meter_id:
   *                       type: string
   *                       format: uuid
   *                     readings:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           timestamp:
   *                             type: string
   *                             format: date-time
   *                           value:
   *                             type: number
   *                           count:
   *                             type: integer
   *                     total_value:
   *                       type: number
   *                     average_value:
   *                       type: number
   *                     peak_value:
   *                       type: number
   *                 message:
   *                   type: string
   *                   example: "Real-time meter readings retrieved successfully"
   */
  getRealtimeReadings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { timeframe = '24h', granularity = 'hour' } = req.query;
    const readings = await meterService.getRealtimeReadings(req.params.id, req.user!.orgId, timeframe as string, granularity as string);
    res.json(ApiResponse.success(readings, 'Real-time meter readings retrieved successfully'));
  });

  /**
   * @swagger
   * /meters/realtime-stats:
   *   get:
   *     summary: Get real-time meter statistics
   *     tags: [Meters]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: event_type
   *         schema:
   *           type: string
   *         description: Filter by event type
   *       - in: query
   *         name: timeframe
   *         schema:
   *           type: string
   *           enum: [1h, 24h, 7d, 30d]
   *           default: 24h
   *         description: Timeframe for statistics
   *     responses:
   *       200:
   *         description: Real-time meter statistics retrieved successfully
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
   *                     total_meters:
   *                       type: integer
   *                     active_meters:
   *                       type: integer
   *                     total_events:
   *                       type: integer
   *                     events_per_minute:
   *                       type: number
   *                     top_event_types:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           event_type:
   *                             type: string
   *                           count:
   *                             type: integer
   *                           percentage:
   *                             type: number
   *                 message:
   *                   type: string
   *                   example: "Real-time meter statistics retrieved successfully"
   */
  getRealtimeStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { event_type, timeframe = '24h' } = req.query;
    const stats = await meterService.getRealtimeStats(req.user!.orgId, event_type as string, timeframe as string);
    res.json(ApiResponse.success(stats, 'Real-time meter statistics retrieved successfully'));
  });

  /**
   * @swagger
   * /meters/{id}/realtime-events:
   *   get:
   *     summary: Get real-time meter events stream
   *     tags: [Meters]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Meter ID
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *           maximum: 100
   *         description: Number of recent events to retrieve
   *       - in: query
   *         name: since
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Get events since this timestamp
   *     responses:
   *       200:
   *         description: Real-time meter events retrieved successfully
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
   *                     meter_id:
   *                       type: string
   *                       format: uuid
   *                     events:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                             format: uuid
   *                           timestamp:
   *                             type: string
   *                             format: date-time
   *                           event_type:
   *                             type: string
   *                           value:
   *                             type: number
   *                           customer_id:
   *                             type: string
   *                             format: uuid
   *                           metadata:
   *                             type: object
   *                     total_events:
   *                       type: integer
   *                 message:
   *                   type: string
   *                   example: "Real-time meter events retrieved successfully"
   */
  getRealtimeEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit = 50, since } = req.query;
    const events = await meterService.getRealtimeEvents(req.params.id, req.user!.orgId, Number(limit), since as string);
    res.json(ApiResponse.success(events, 'Real-time meter events retrieved successfully'));
  });

  /**
   * @swagger
   * /meters/{id}/performance-metrics:
   *   get:
   *     summary: Get meter performance metrics
   *     tags: [Meters]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Meter ID
   *       - in: query
   *         name: timeframe
   *         schema:
   *           type: string
   *           enum: [1h, 24h, 7d, 30d]
   *           default: 24h
   *         description: Timeframe for metrics
   *     responses:
   *       200:
   *         description: Meter performance metrics retrieved successfully
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
   *                     meter_id:
   *                       type: string
   *                       format: uuid
   *                     throughput:
   *                       type: object
   *                       properties:
   *                         events_per_second:
   *                           type: number
   *                         events_per_minute:
   *                           type: number
   *                         events_per_hour:
   *                           type: number
   *                     latency:
   *                       type: object
   *                       properties:
   *                         average_ms:
   *                           type: number
   *                         p95_ms:
   *                           type: number
   *                         p99_ms:
   *                           type: number
   *                     reliability:
   *                       type: object
   *                       properties:
   *                         success_rate:
   *                           type: number
   *                         error_rate:
   *                           type: number
   *                         uptime_percentage:
   *                           type: number
   *                 message:
   *                   type: string
   *                   example: "Meter performance metrics retrieved successfully"
   */
  getPerformanceMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { timeframe = '24h' } = req.query;
    const metrics = await meterService.getPerformanceMetrics(req.params.id, req.user!.orgId, timeframe as string);
    res.json(ApiResponse.success(metrics, 'Meter performance metrics retrieved successfully'));
  });

  /**
   * @swagger
   * /meters/health-monitoring:
   *   get:
   *     summary: Get meter health and status monitoring
   *     tags: [Meters]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [healthy, warning, critical, offline]
   *         description: Filter by health status
   *       - in: query
   *         name: event_type
   *         schema:
   *           type: string
   *         description: Filter by event type
   *     responses:
   *       200:
   *         description: Meter health monitoring data retrieved successfully
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
   *                     overall_health:
   *                       type: object
   *                       properties:
   *                         healthy_meters:
   *                           type: integer
   *                         warning_meters:
   *                           type: integer
   *                         critical_meters:
   *                           type: integer
   *                         offline_meters:
   *                           type: integer
   *                         health_score:
   *                           type: number
   *                     meters:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                             format: uuid
   *                           name:
   *                             type: string
   *                           status:
   *                             type: string
   *                             enum: [healthy, warning, critical, offline]
   *                           last_event:
   *                             type: string
   *                             format: date-time
   *                           events_last_hour:
   *                             type: integer
   *                           error_rate:
   *                             type: number
   *                 message:
   *                   type: string
   *                   example: "Meter health monitoring data retrieved successfully"
   */
  getHealthMonitoring = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, event_type } = req.query;
    const healthData = await meterService.getHealthMonitoring(req.user!.orgId, status as string, event_type as string);
    res.json(ApiResponse.success(healthData, 'Meter health monitoring data retrieved successfully'));
  });
}

export default new MeterController();