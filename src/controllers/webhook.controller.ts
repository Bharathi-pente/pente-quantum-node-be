import { Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import webhookService from '../services/webhook.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Webhook management
 */

export class WebhookController {
  /**
   * @swagger
   * /webhooks:
   *   post:
   *     summary: Create a new webhook
   *     tags: [Webhooks]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - url
   *               - subscribed_events
   *             properties:
   *               name:
   *                 type: string
   *                 description: Webhook name
   *               url:
   *                 type: string
   *                 format: uri
   *                 description: Webhook URL
   *               subscribed_events:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Events to subscribe to
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *                 description: Webhook status
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = {
      ...req.body,
      org_id: req.user?.orgId,
    };

    const webhook = await webhookService.webhookService.create(data);

    res.status(201).json(ApiResponse.success(webhook, 'Webhook created successfully'));
  });

  /**
   * @swagger
   * /webhooks:
   *   get:
   *     summary: Get all webhooks
   *     tags: [Webhooks]
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
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by name
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, status, search } = req.query;

    const result = await webhookService.webhookService.findAll(
      req.user?.orgId!,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 10,
      { status, search }
    );

    const response = {
      webhooks: result.webhooks,
      pagination: {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        total: result.total,
        totalPages: Math.ceil(result.total / (parseInt(limit as string) || 10)),
      },
    };

    res.json(ApiResponse.success(response, 'Webhooks retrieved successfully'));
  });

  /**
   * @swagger
   * /webhooks/{id}:
   *   get:
   *     summary: Get webhook by ID
   *     tags: [Webhooks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Webhook ID
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const webhook = await webhookService.webhookService.findById(id);

    res.json(ApiResponse.success(webhook, 'Webhook retrieved successfully'));
  });

  /**
   * @swagger
   * /webhooks/{id}:
   *   put:
   *     summary: Update webhook
   *     tags: [Webhooks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Webhook ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Webhook name
   *               url:
   *                 type: string
   *                 format: uri
   *                 description: Webhook URL
   *               subscribed_events:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Events to subscribe to
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *                 description: Webhook status
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const webhook = await webhookService.webhookService.update(id, req.body);

    res.json(ApiResponse.success(webhook, 'Webhook updated successfully'));
  });

  /**
   * @swagger
   * /webhooks/{id}:
   *   delete:
   *     summary: Delete webhook
   *     tags: [Webhooks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Webhook ID
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    await webhookService.webhookService.delete(id);

    res.json(ApiResponse.success(null, 'Webhook deleted successfully'));
  });
}

export class WebhookLogController {
  /**
   * @swagger
   * /webhooks/stats:
   *   get:
   *     summary: Get webhook statistics
   *     tags: [Webhooks]
   *     description: Returns webhook statistics for the organization including events in last 24h, success rate, and average response time
   */
  getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await webhookService.webhookLogService.getStats(req.user?.orgId!);

    res.json(ApiResponse.success(stats, 'Webhook statistics retrieved successfully'));
  });

  /**
   * @swagger
   * /webhook-logs:
   *   get:
   *     summary: Get webhook logs
   *     tags: [Webhooks]
   *     parameters:
   *       - in: query
   *         name: webhook_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by webhook ID
   *       - in: query
   *         name: event_type
   *         schema:
   *           type: string
   *         description: Filter by event type
   *       - in: query
   *         name: delivery_status
   *         schema:
   *           type: string
   *           enum: [success, failed, pending]
   *         description: Filter by delivery status
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
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { webhookId, event, status, page, limit } = req.query;

    const result = await webhookService.webhookLogService.findAll(
      webhookId as string,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 10,
      { event, status }
    );

    const response = {
      logs: result.logs,
      pagination: {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        total: result.total,
        totalPages: Math.ceil(result.total / (parseInt(limit as string) || 10)),
      },
    };

    res.json(ApiResponse.success(response, 'Webhook logs retrieved successfully'));
  });
}

export class WebhookEventController {
  /**
   * @swagger
   * /webhook-events:
   *   get:
   *     summary: Get available webhook events
   *     tags: [Webhooks]
   */
  getAvailableEvents = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const events = await webhookService.webhookEventService.getAvailableEvents();

    res.json(ApiResponse.success(events, 'Available webhook events retrieved successfully'));
  });
}

const webhookController = new WebhookController();
const webhookLogController = new WebhookLogController();
const webhookEventController = new WebhookEventController();

export default {
  webhookController,
  webhookLogController,
  webhookEventController,
};