import { Router } from 'express';
import meterController from '../controllers/meter.controller';
import { validate } from '../middleware/validation.middleware';
import authMiddleware from '../middleware/keycloakAuth.middleware';
import enrichUserMiddleware from '../middleware/enrichUser.middleware';
import {
  createMeterSchema,
  updateMeterSchema,
  getMeterSchema,
  getRealtimeReadingsSchema,
  getRealtimeStatsSchema,
  getRealtimeEventsSchema,
  getPerformanceMetricsSchema,
  getHealthMonitoringSchema,
} from '../validators/meter.validator';

const router = Router();

// Apply authentication to all meter routes
router.use(authMiddleware);
router.use(enrichUserMiddleware);

/**
 * @route   POST /api/v1/meters
 * @desc    Create meter
 * @access  Private (admin)
 */
router.post('/', validate(createMeterSchema), meterController.create);

/**
 * @route   GET /api/v1/meters
 * @desc    Get all meters
 * @access  Private
 */
router.get('/', meterController.getAll);

/**
 * @route   GET /api/v1/meters/all
 * @desc    Get all meters (admin only - for debugging)
 * @access  Private (admin)
 */
router.get('/all', meterController.getAllAdmin);

/**
 * @route   GET /api/v1/meters/:id
 * @desc    Get meter by ID
 * @access  Private
 */
router.get('/:id', validate(getMeterSchema), meterController.getById);

/**
 * @route   PUT /api/v1/meters/:id
 * @desc    Update meter
 * @access  Private (admin)
 */
router.put('/:id', validate(updateMeterSchema), meterController.update);

/**
 * @route   DELETE /api/v1/meters/:id
 * @desc    Delete meter
 * @access  Private (admin)
 */
router.delete('/:id', validate(getMeterSchema), meterController.delete);

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
 */
router.get('/:id/realtime-readings', validate(getRealtimeReadingsSchema), meterController.getRealtimeReadings);

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
 */
router.get('/realtime-stats', validate(getRealtimeStatsSchema), meterController.getRealtimeStats);

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
 */
router.get('/:id/realtime-events', validate(getRealtimeEventsSchema), meterController.getRealtimeEvents);

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
 */
router.get('/:id/performance-metrics', validate(getPerformanceMetricsSchema), meterController.getPerformanceMetrics);

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
 */
router.get('/health-monitoring', validate(getHealthMonitoringSchema), meterController.getHealthMonitoring);

export default router;