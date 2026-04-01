import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import orgPaymentService from '../services/orgPayment.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Organization Payments
 *   description: Organization-level payment processing and management
 */

export class OrgPaymentController {
  /**
   * @swagger
   * /org-payments:
   *   post:
   *     summary: Create a new organization payment
   *     tags: [Organization Payments]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - amount
   *               - payment_method
   *             properties:
   *               amount:
   *                 type: number
   *                 minimum: 0.01
   *                 description: Payment amount
   *               currency:
   *                 type: string
   *                 description: Currency code (default USD)
   *               payment_method:
   *                 type: string
   *                 description: Payment method (e.g., credit_card, bank_transfer, check)
   *               status:
   *                 type: string
   *                 enum: [succeeded, failed, pending, refunded]
   *                 description: Payment status (default pending)
   *               payment_date:
   *                 type: string
   *                 format: date-time
   *                 description: Payment date (optional)
   *               description:
   *                 type: string
   *                 description: Payment description (optional)
   *     responses:
   *       201:
   *         description: Organization payment created successfully
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.body.org_id || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('org_id in body or x-org-id header is required'));
      return;
    }
    const orgPayment = await orgPaymentService.create(req.body, orgId);
    res.status(201).json(ApiResponse.success(orgPayment, 'Organization payment created successfully'));
  });

  /**
   * @swagger
   * /org-payments:
   *   get:
   *     summary: Get all organization payments
   *     tags: [Organization Payments]
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
   *         name: status
   *         schema:
   *           type: string
   *           enum: [succeeded, failed, pending, refunded]
   *         description: Filter by status
   *       - in: query
   *         name: payment_method
   *         schema:
   *           type: string
   *         description: Filter by payment method
   *       - in: query
   *         name: date_from
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter from payment date
   *       - in: query
   *         name: date_to
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter to payment date
   *     responses:
   *       200:
   *         description: List of organization payments
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const filters = {
      status: req.query.status as string,
      payment_method: req.query.payment_method as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const result = await orgPaymentService.findAll(orgId, page, limit, filters);
    res.json(ApiResponse.success(result, 'Organization payments retrieved successfully'));
  });

  /**
   * @swagger
   * /org-payments/{id}:
   *   get:
   *     summary: Get organization payment by ID
   *     tags: [Organization Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Organization payment ID
   *     responses:
   *       200:
   *         description: Organization payment details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    const orgPayment = await orgPaymentService.findById(req.params.id, orgId);
    res.json(ApiResponse.success(orgPayment, 'Organization payment retrieved successfully'));
  });

  /**
   * @swagger
   * /org-payments/{id}:
   *   put:
   *     summary: Update organization payment
   *     tags: [Organization Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Organization payment ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [succeeded, failed, pending, refunded]
   *                 description: Payment status
   *               payment_date:
   *                 type: string
   *                 format: date-time
   *                 description: Payment date
   *               failure_reason:
   *                 type: string
   *                 description: Failure reason (for failed payments)
   *               description:
   *                 type: string
   *                 description: Payment description
   *     responses:
   *       200:
   *         description: Organization payment updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.body.org_id || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('org_id in body or x-org-id header is required'));
      return;
    }
    const orgPayment = await orgPaymentService.update(req.params.id, req.body, orgId);
    res.json(ApiResponse.success(orgPayment, 'Organization payment updated successfully'));
  });

  /**
   * @swagger
   * /org-payments/{id}:
   *   delete:
   *     summary: Delete organization payment
   *     tags: [Organization Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Organization payment ID
   *     responses:
   *       200:
   *         description: Organization payment deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.query.orgId as string || req.headers['x-org-id'] as string;
    if (!orgId) {
      res.status(400).json(ApiResponse.error('orgId query parameter or x-org-id header is required'));
      return;
    }
    await orgPaymentService.delete(req.params.id, orgId);
    res.json(ApiResponse.success(null, 'Organization payment deleted successfully'));
  });
}

export default new OrgPaymentController();