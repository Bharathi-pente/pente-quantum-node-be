import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import paymentMethodService from '../services/paymentMethod.service';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Payment Methods
 *   description: Customer payment method management
 */

export class PaymentMethodController {
  /**
   * @swagger
   * /payment-methods:
   *   post:
   *     summary: Create a new payment method
   *     tags: [Payment Methods]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - method_type
   *             properties:
   *               method_type:
   *                 type: string
   *                 enum: [card, bank_account]
   *                 description: Payment method type
   *               brand:
   *                 type: string
   *                 description: Card brand (visa, mastercard, etc.)
   *               last4:
   *                 type: string
   *                 description: Last 4 digits
   *               exp_month:
   *                 type: integer
   *                 description: Expiration month
   *               exp_year:
   *                 type: integer
   *                 description: Expiration year
   *               bank_name:
   *                 type: string
   *                 description: Bank name for ACH
   *               account_type:
   *                 type: string
   *                 enum: [checking, savings]
   *                 description: Account type for ACH
   *               billing_name:
   *                 type: string
   *                 description: Billing name
   *               billing_address:
   *                 type: object
   *                 description: Billing address
   *               is_default:
   *                 type: boolean
   *                 description: Set as default payment method
   *     responses:
   *       201:
   *         description: Payment method created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaymentMethodResponse'
   *       400:
   *         description: Bad request
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Customer not found
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerId = req.headers['x-customer-id'] as string;
    if (!customerId) {
      throw ApiError.badRequest('Customer ID required');
    }

    const paymentMethod = await paymentMethodService.create(req.body, customerId);

    res.status(201).json(
      ApiResponse.success(paymentMethod, 'Payment method created successfully')
    );
  });

  /**
   * @swagger
   * /payment-methods:
   *   get:
   *     summary: Get all payment methods for customer
   *     tags: [Payment Methods]
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
   *     responses:
   *       200:
   *         description: List of payment methods
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
   *                     paymentMethods:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/PaymentMethod'
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: integer
   *                         limit:
   *                           type: integer
   *                         total:
   *                           type: integer
   *                         pages:
   *                           type: integer
   *                 message:
   *                   type: string
   *                   example: "Payment methods retrieved successfully"
   *       401:
   *         description: Unauthorized
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerId = req.headers['x-customer-id'] as string;
    if (!customerId) {
      throw ApiError.badRequest('Customer ID required');
    }

    const { page, limit } = req.query;
    const result = await paymentMethodService.findAll(
      customerId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 10
    );

    const response = {
      paymentMethods: result.paymentMethods,
      pagination: {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        total: result.total,
        pages: Math.ceil(result.total / (parseInt(limit as string) || 10)),
      },
    };

    res.json(ApiResponse.success(response, 'Payment methods retrieved successfully'));
  });

  /**
   * @swagger
   * /payment-methods/{id}:
   *   get:
   *     summary: Get payment method by ID
   *     tags: [Payment Methods]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Payment method ID
   *     responses:
   *       200:
   *         description: Payment method details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaymentMethodResponse'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Payment method not found
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerId = req.headers['x-customer-id'] as string;
    if (!customerId) {
      throw ApiError.badRequest('Customer ID required');
    }

    const paymentMethod = await paymentMethodService.findById(req.params.id, customerId);

    res.json(ApiResponse.success(paymentMethod, 'Payment method retrieved successfully'));
  });

  /**
   * @swagger
   * /payment-methods/{id}:
   *   put:
   *     summary: Update payment method
   *     tags: [Payment Methods]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Payment method ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdatePaymentMethod'
   *     responses:
   *       200:
   *         description: Payment method updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaymentMethodResponse'
   *       400:
   *         description: Bad request
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Payment method not found
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerId = req.headers['x-customer-id'] as string;
    if (!customerId) {
      throw ApiError.badRequest('Customer ID required');
    }

    const paymentMethod = await paymentMethodService.update(req.params.id, customerId, req.body);

    res.json(ApiResponse.success(paymentMethod, 'Payment method updated successfully'));
  });

  /**
   * @swagger
   * /payment-methods/{id}:
   *   delete:
   *     summary: Delete payment method
   *     tags: [Payment Methods]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Payment method ID
   *     responses:
   *       200:
   *         description: Payment method deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: null
   *                 message:
   *                   type: string
   *                   example: "Payment method deleted successfully"
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Payment method not found
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerId = req.headers['x-customer-id'] as string;
    if (!customerId) {
      throw ApiError.badRequest('Customer ID required');
    }

    await paymentMethodService.delete(req.params.id, customerId);

    res.json(ApiResponse.success(null, 'Payment method deleted successfully'));
  });

  /**
   * @swagger
   * /payment-methods/{id}/default:
   *   post:
   *     summary: Set payment method as default
   *     tags: [Payment Methods]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Payment method ID
   *     responses:
   *       200:
   *         description: Payment method set as default successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaymentMethodResponse'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Payment method not found
   */
  setDefault = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerId = req.headers['x-customer-id'] as string;
    if (!customerId) {
      throw ApiError.badRequest('Customer ID required');
    }

    const paymentMethod = await paymentMethodService.setDefault(req.params.id, customerId);

    res.json(ApiResponse.success(paymentMethod, 'Payment method set as default successfully'));
  });
}