import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import orgPaymentMethodService from '../services/orgPaymentMethod.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Organization Payment Methods
 *   description: Organization payment method management
 */

export class OrgPaymentMethodController {
  /**
   * @swagger
   * /org-payment-methods:
   *   post:
   *     summary: Create a new organization payment method
   *     tags: [Organization Payment Methods]
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
   *               - type
   *             properties:
   *               name:
   *                 type: string
   *                 description: Payment method name
   *               type:
   *                 type: string
   *                 description: Payment method type (e.g., card, bank, paypal)
   *               details:
   *                 type: object
   *                 description: Additional payment method details
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *     responses:
   *       201:
   *         description: Payment method created successfully
   *       400:
   *         description: Bad request
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const paymentMethod = await orgPaymentMethodService.create(req.body, req.user!.orgId);
    res.status(201).json(ApiResponse.success(paymentMethod, 'Organization payment method created successfully'));
  });

  /**
   * @swagger
   * /org-payment-methods:
   *   get:
   *     summary: Get all organization payment methods
   *     tags: [Organization Payment Methods]
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
   *           enum: [active, inactive]
   *         description: Filter by status
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Filter by type
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search in name and type
   *     responses:
   *       200:
   *         description: List of organization payment methods
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filters = {
      status: req.query.status as string,
      type: req.query.type as string,
      search: req.query.search as string,
    };

    const result = await orgPaymentMethodService.findAll(req.user!.orgId, page, limit, filters);
    res.json(ApiResponse.success(result, 'Organization payment methods retrieved successfully'));
  });

  /**
   * @swagger
   * /org-payment-methods/{id}:
   *   get:
   *     summary: Get organization payment method by ID
   *     tags: [Organization Payment Methods]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Organization payment method ID
   *     responses:
   *       200:
   *         description: Organization payment method details
   *       404:
   *         description: Payment method not found
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const paymentMethod = await orgPaymentMethodService.findById(req.params.id, req.user!.orgId);
    res.json(ApiResponse.success(paymentMethod, 'Organization payment method retrieved successfully'));
  });

  /**
   * @swagger
   * /org-payment-methods/{id}:
   *   put:
   *     summary: Update organization payment method
   *     tags: [Organization Payment Methods]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Organization payment method ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               type:
   *                 type: string
   *               details:
   *                 type: object
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *     responses:
   *       200:
   *         description: Payment method updated successfully
   *       404:
   *         description: Payment method not found
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const paymentMethod = await orgPaymentMethodService.update(req.params.id, req.body, req.user!.orgId);
    res.json(ApiResponse.success(paymentMethod, 'Organization payment method updated successfully'));
  });

  /**
   * @swagger
   * /org-payment-methods/{id}:
   *   delete:
   *     summary: Delete organization payment method
   *     tags: [Organization Payment Methods]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Organization payment method ID
   *     responses:
   *       204:
   *         description: Payment method deleted successfully
   *       404:
   *         description: Payment method not found
   *       409:
   *         description: Cannot delete payment method in use
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await orgPaymentMethodService.delete(req.params.id, req.user!.orgId);
    res.status(204).send();
  });
}

export default new OrgPaymentMethodController();