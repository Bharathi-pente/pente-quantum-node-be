import { Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import { AlertsService } from '../services/alerts.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

const alertsService = new AlertsService();

/**
 * @swagger
 * tags:
 *   name: Alerts
 *   description: Alert management
 */

export class AlertsController {
  /**
   * @swagger
   * /organizations/{orgId}/alerts:
   *   post:
   *     summary: Create a new alert
   *     tags: [Alerts]
   *     parameters:
   *       - in: path
   *         name: orgId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - alert_type
   *               - condition_expr
   *             properties:
   *               name:
   *                 type: string
   *               alert_type:
   *                 type: string
   *                 enum: [usage, billing, customer, churn, system]
   *               condition_expr:
   *                 type: string
   *               threshold:
   *                 type: number
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *     responses:
   *       201:
   *         description: Alert created successfully
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orgId } = req.params;
    const alert = await alertsService.create(orgId, req.body);
    res.status(201).json(ApiResponse.success(alert, 'Alert created successfully'));
  });

  /**
   * @swagger
   * /organizations/{orgId}/alerts:
   *   get:
   *     summary: Get all alerts for an organization
   *     tags: [Alerts]
   *     parameters:
   *       - in: path
   *         name: orgId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive]
   *       - in: query
   *         name: alert_type
   *         schema:
   *           type: string
   *           enum: [usage, billing, customer, churn, system]
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: List of alerts
   */
  getByOrgId = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orgId } = req.params;
    const { status, alert_type, page, limit } = req.query;

    const filters = {
      status: status as string,
      alert_type: alert_type as string,
    };

    const result = await alertsService.findByOrgId(
      orgId,
      filters,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 10
    );

    res.json(ApiResponse.success(result, 'Alerts retrieved successfully'));
  });

  /**
   * @swagger
   * /organizations/{orgId}/alerts/{id}:
   *   get:
   *     summary: Get alert by ID
   *     tags: [Alerts]
   *     parameters:
   *       - in: path
   *         name: orgId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Alert details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const alert = await alertsService.findById(id);
    res.json(ApiResponse.success(alert, 'Alert retrieved successfully'));
  });

  /**
   * @swagger
   * /organizations/{orgId}/alerts/{id}:
   *   put:
   *     summary: Update alert
   *     tags: [Alerts]
   *     parameters:
   *       - in: path
   *         name: orgId
   *         required: true
   *         schema:
   *           type: string
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
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               alert_type:
   *                 type: string
   *                 enum: [usage, billing, customer, churn, system]
   *               condition_expr:
   *                 type: string
   *               threshold:
   *                 type: number
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *     responses:
   *       200:
   *         description: Alert updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const alert = await alertsService.update(id, req.body);
    res.json(ApiResponse.success(alert, 'Alert updated successfully'));
  });

  /**
   * @swagger
   * /organizations/{orgId}/alerts/{id}:
   *   delete:
   *     summary: Delete alert
   *     tags: [Alerts]
   *     parameters:
   *       - in: path
   *         name: orgId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Alert deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await alertsService.delete(id);
    res.json(ApiResponse.success(result, 'Alert deleted successfully'));
  });

  /**
   * @swagger
   * /organizations/{orgId}/alerts/{id}/history:
   *   get:
   *     summary: Get alert history
   *     tags: [Alerts]
   *     parameters:
   *       - in: path
   *         name: orgId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Alert history
   */
  getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await alertsService.getAlertHistory(
      id,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );

    res.json(ApiResponse.success(result, 'Alert history retrieved successfully'));
  });

  /**
   * @swagger
   * /api/v1/organizations/{orgId}/alerts/history:
   *   get:
   *     summary: Get alert history for organization
   *     tags: [Alerts]
   *     parameters:
   *       - in: path
   *         name: orgId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Alert history
   */
  getOrganizationHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orgId } = req.params;
    const { page, limit } = req.query;

    const result = await alertsService.getOrganizationAlertHistory(
      orgId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );

    res.json(ApiResponse.success(result, 'Organization alert history retrieved successfully'));
  });
}