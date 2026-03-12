import { Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import externalEventsService from '../services/externalEvents.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: External Events
 *   description: User events metrics from external service
 */

export class ExternalEventsController {
  /**
   * @swagger
   * /user/events/{userId}:
   *   get:
   *     summary: Get user events metrics
   *     tags: [External Events]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *           minimum: 1
   *           maximum: 1000
   *         description: Number of events to retrieve
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *           minimum: 0
   *         description: Offset for pagination
   *     responses:
   *       200:
   *         description: User events metrics retrieved successfully
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
   *                   example: User events retrieved successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     customer_id:
   *                       type: string
   *                       example: org_acme
   *                     error_rate:
   *                       type: string
   *                       example: "0.0%"
   *                     events:
   *                       type: integer
   *                       example: 4010
   *                     org_id:
   *                       type: string
   *                       example: org_acme
   *                     total_cost:
   *                       type: string
   *                       example: "$60.1500"
   *                     total_tokens:
   *                       type: string
   *                       example: "60.1k"
   *                     user_id:
   *                       type: string
   *                       example: user_acme_01
   *       400:
   *         description: Invalid parameters
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  getUserEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    // Validate parameters
    if (!userId) {
      return res.status(400).json(
        ApiResponse.error('User ID is required')
      );
    }

    if (limit < 1 || limit > 1000) {
      return res.status(400).json(
        ApiResponse.error('Limit must be between 1 and 1000')
      );
    }

    if (offset < 0) {
      return res.status(400).json(
        ApiResponse.error('Offset must be non-negative')
      );
    }

    // Fetch user events from external service
    const eventsData = await externalEventsService.getUserEvents(
      userId,
      limit,
      offset
    );

    return res.status(200).json(
      ApiResponse.success(eventsData, 'User events retrieved successfully')
    );
  });

  /**
   * Return raw events list (count + events array)
   */
  getUserEventsList = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) return res.status(400).json(ApiResponse.error('User ID is required'));

    const list = await externalEventsService.getUserEventsList(userId, limit, offset);
    return res.status(200).json(ApiResponse.success(list, 'Events list retrieved'));
  });

  /**
   * Token usage summary computed from events
   */
  getUserTokenUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) return res.status(400).json(ApiResponse.error('User ID is required'));

    const usage = await externalEventsService.getUserTokenUsage(userId, limit, offset);
    return res.status(200).json(ApiResponse.success(usage, 'Token usage retrieved'));
  });

  /**
   * @swagger
   * /user/events/health:
   *   get:
   *     summary: Check external events service health
   *     tags: [External Events]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Service health status
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
   *                   example: External events service is healthy
   *                 data:
   *                   type: object
   *                   properties:
   *                     baseURL:
   *                       type: string
   *                       example: https://3qw7hp8r-8080.inc1.devtunnels.ms/v1
   *                     organizationId:
   *                       type: string
   *                       example: org_acme
   *                     customerId:
   *                       type: string
   *                       example: org_acme
   */
  getServiceHealth = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const healthData = {
      baseURL: externalEventsService.getBaseURL(),
      organizationId: externalEventsService.getOrganizationId(),
      customerId: externalEventsService.getCustomerId(),
    };

    return res.status(200).json(
      ApiResponse.success(healthData, 'External events service is healthy')
    );
  });
}

export default new ExternalEventsController();
