import { Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import paymentService from '../services/payment.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing and management
 */

export class PaymentController {
  /**
   * @swagger
   * /payments:
   *   post:
   *     summary: Create a new payment
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - invoice_id
   *               - amount
   *               - payment_method_id
   *             properties:
   *               invoice_id:
   *                 type: string
   *                 format: uuid
   *                 description: Invoice ID
   *               amount:
   *                 type: number
   *                 minimum: 0.01
   *                 description: Payment amount
   *               currency:
   *                 type: string
   *                 description: Currency code (default USD)
   *               payment_method_id:
   *                 type: string
   *                 format: uuid
   *                 description: Payment method ID
   *               payment_date:
   *                 type: string
   *                 format: date-time
   *                 description: Payment date (optional)
   *               description:
   *                 type: string
   *                 description: Payment description (optional)
   *     responses:
   *       201:
   *         description: Payment created successfully
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payment = await paymentService.create(req.body, req.user!.orgId);
    res.status(201).json(ApiResponse.success(payment, 'Payment created successfully'));
  });

  /**
   * @swagger
   * /payments:
   *   get:
   *     summary: Get all payments
   *     tags: [Payments]
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
   *         name: customer_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by customer ID
   *       - in: query
   *         name: invoice_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by invoice ID
   *       - in: query
   *         name: payment_method_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by payment method ID
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
   *         description: List of payments
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = {
      status: req.query.status as string,
      customer_id: req.query.customer_id as string,
      invoice_id: req.query.invoice_id as string,
      payment_method_id: req.query.payment_method_id as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    const result = await paymentService.findAll(req.user!.orgId, page, limit, filters);
    res.json(ApiResponse.success(result, 'Payments retrieved successfully'));
  });

  /**
   * @swagger
   * /payments/{id}:
   *   get:
   *     summary: Get payment by ID
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Payment ID
   *     responses:
   *       200:
   *         description: Payment details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payment = await paymentService.findById(req.params.id, req.user!.orgId);
    res.json(ApiResponse.success(payment, 'Payment retrieved successfully'));
  });

  /**
   * @swagger
   * /payments/{id}:
   *   put:
   *     summary: Update payment
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Payment ID
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
   *         description: Payment updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payment = await paymentService.update(req.params.id, req.body, req.user!.orgId);
    res.json(ApiResponse.success(payment, 'Payment updated successfully'));
  });

  /**
   * @swagger
   * /payments/{id}:
   *   delete:
   *     summary: Delete payment
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Payment ID
   *     responses:
   *       200:
   *         description: Payment deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await paymentService.delete(req.params.id, req.user!.orgId);
    res.json(ApiResponse.success(null, 'Payment deleted successfully'));
  });
}

export default new PaymentController();