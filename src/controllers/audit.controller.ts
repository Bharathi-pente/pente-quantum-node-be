import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { AuditService } from '../services/audit.service';
import { AuditLogFilter } from '../types';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

const auditService = new AuditService();

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Audit log management
 */

export class AuditController {
  /**
   * @swagger
   * /audit/logs:
   *   get:
   *     summary: Get audit logs with filtering and pagination
   *     tags: [Audit]
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
   *           default: 20
   *         description: Number of items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for actor, action, or resource
   *       - in: query
   *         name: actor
   *         schema:
   *           type: string
   *         description: Filter by actor email
   *       - in: query
   *         name: action
   *         schema:
   *           type: string
   *         description: Filter by action type
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [success, failed]
   *         description: Filter by status
   *       - in: query
   *         name: date_from
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter from date (YYYY-MM-DD)
   *       - in: query
   *         name: date_to
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter to date (YYYY-MM-DD)
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           default: created_at
   *         description: Sort field
   *       - in: query
   *         name: order
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Sort order
   *     responses:
   *       200:
   *         description: Audit logs retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/AuditLog'
   *                 meta:
   *                   $ref: '#/components/schemas/PaginationMeta'
   */
  getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const filters: AuditLogFilter = req.query;

    const result = await auditService.getAuditLogs(orgId, filters);

    res.json(ApiResponse.success({ data: result.data, meta: result.meta }, 'Audit logs retrieved successfully'));
  });

  /**
   * @swagger
   * /audit/logs/{id}:
   *   get:
   *     summary: Get audit log by ID
   *     tags: [Audit]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Audit log ID
   *     responses:
   *       200:
   *         description: Audit log retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/AuditLog'
   *       404:
   *         description: Audit log not found
   */
  getAuditLogById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const { id } = req.params;

    const auditLog = await auditService.getAuditLogById(orgId, id);

    ApiResponse.success(res, 'Audit log retrieved successfully', auditLog);
  });

  /**
   * @swagger
   * /audit/stats:
   *   get:
   *     summary: Get audit statistics
   *     tags: [Audit]
   *     parameters:
   *       - in: query
   *         name: date_from
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter from date (YYYY-MM-DD)
   *       - in: query
   *         name: date_to
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter to date (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: Audit statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalLogs:
   *                       type: integer
   *                     successCount:
   *                       type: integer
   *                     failureCount:
   *                       type: integer
   *                     successRate:
   *                       type: number
   *                     topActions:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           action:
   *                             type: string
   *                           count:
   *                             type: integer
   *                     recentActivity:
   *                       type: array
   *                       items:
   *                         type: object
   */
  getAuditStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const { date_from, date_to } = req.query;

    const stats = await auditService.getAuditStats(orgId, date_from as string, date_to as string);

    ApiResponse.success(res, 'Audit statistics retrieved successfully', stats);
  });

  /**
   * @swagger
   * /audit/export:
   *   get:
   *     summary: Export audit logs
   *     tags: [Audit]
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for actor, action, or resource
   *       - in: query
   *         name: actor
   *         schema:
   *           type: string
   *         description: Filter by actor email
   *       - in: query
   *         name: action
   *         schema:
   *           type: string
   *         description: Filter by action type
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [success, failed]
   *         description: Filter by status
   *       - in: query
   *         name: date_from
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter from date (YYYY-MM-DD)
   *       - in: query
   *         name: date_to
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter to date (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: Audit logs exported successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/AuditLog'
   */
  exportAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const filters: AuditLogFilter = req.query;

    const auditLogs = await auditService.exportAuditLogs(orgId, filters);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');

    ApiResponse.success(res, 'Audit logs exported successfully', auditLogs);
  });
}