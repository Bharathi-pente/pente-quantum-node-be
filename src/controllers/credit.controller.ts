import { Request, Response } from 'express';
import { CreditService } from '../services/credit.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { CreateCreditInput, UpdateCreditInput, GetCreditsInput, GetCreditByIdInput, DeleteCreditInput, GetCreditLedgerInput } from '../validators/credit.validator';

export class CreditController {
  /**
   * @swagger
   * /api/credits:
   *   post:
   *     tags: [Credits]
   *     summary: Create a new credit
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - customer_id
   *               - credit_type
   *               - original_amount
   *             properties:
   *               customer_id:
   *                 type: string
   *                 format: uuid
   *               credit_type:
   *                 type: string
   *                 enum: [prepaid, promotional, commit, compensation]
   *               original_amount:
   *                 type: number
   *                 minimum: 0
   *               remaining_amount:
   *                 type: number
   *                 minimum: 0
   *               used_amount:
   *                 type: number
   *                 minimum: 0
   *                 default: 0
   *               expires_at:
   *                 type: string
   *                 format: date-time
   *               priority:
   *                 type: integer
   *                 minimum: 0
   *                 maximum: 100
   *                 default: 0
   *               applicable_to:
   *                 type: string
   *                 default: "all"
   *               status:
   *                 type: string
   *                 enum: [active, expired, used]
   *                 default: "active"
   *               reason:
   *                 type: string
   *     responses:
   *       201:
   *         description: Credit created successfully
   *       400:
   *         description: Invalid input
   *       404:
   *         description: Customer not found
   */
  static createCredit = asyncHandler(async (req: Request, res: Response) => {
    const validatedData: CreateCreditInput = req as any;
    const orgId = (req as any).orgId;
    const userId = (req as any).userId;

    const credit = await CreditService.createCredit(validatedData.body, orgId, userId);

    res.status(201).json(ApiResponse.success(credit, 'Credit created successfully'));
  });

  /**
   * @swagger
   * /api/credits:
   *   get:
   *     tags: [Credits]
   *     summary: Get all credits with pagination and filtering
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: customer_id
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, expired, used]
   *       - in: query
   *         name: credit_type
   *         schema:
   *           type: string
   *           enum: [prepaid, promotional, commit, compensation]
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *     responses:
   *       200:
   *         description: Credits retrieved successfully
   */
  static getCredits = asyncHandler(async (req: Request, res: Response) => {
    const validatedQuery: GetCreditsInput = req as any;
    const orgId = (req as any).orgId;

    const result = await CreditService.getCredits(validatedQuery.query, orgId);

    res.status(200).json(ApiResponse.success(result, 'Credits retrieved successfully'));
  });

  /**
   * @swagger
   * /api/credits/{id}:
   *   get:
   *     tags: [Credits]
   *     summary: Get credit by ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Credit retrieved successfully
   *       404:
   *         description: Credit not found
   */
  static getCreditById = asyncHandler(async (req: Request, res: Response) => {
    const validatedParams: GetCreditByIdInput = req as any;
    const orgId = (req as any).orgId;

    const credit = await CreditService.getCreditById(validatedParams.params.id, orgId);

    res.status(200).json(ApiResponse.success(credit, 'Credit retrieved successfully'));
  });

  /**
   * @swagger
   * /api/credits/{id}:
   *   put:
   *     tags: [Credits]
   *     summary: Update credit
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               credit_type:
   *                 type: string
   *                 enum: [prepaid, promotional, commit, compensation]
   *               original_amount:
   *                 type: number
   *                 minimum: 0
   *               remaining_amount:
   *                 type: number
   *                 minimum: 0
   *               used_amount:
   *                 type: number
   *                 minimum: 0
   *               expires_at:
   *                 type: string
   *                 format: date-time
   *               priority:
   *                 type: integer
   *                 minimum: 0
   *                 maximum: 100
   *               applicable_to:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [active, expired, used]
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Credit updated successfully
   *       404:
   *         description: Credit not found
   */
  static updateCredit = asyncHandler(async (req: Request, res: Response) => {
    const validatedData: UpdateCreditInput = req as any;
    const orgId = (req as any).orgId;
    const userId = (req as any).userId;

    const credit = await CreditService.updateCredit(validatedData.params.id, validatedData.body, orgId, userId);

    res.status(200).json(ApiResponse.success(credit, 'Credit updated successfully'));
  });

  /**
   * @swagger
   * /api/credits/{id}:
   *   delete:
   *     tags: [Credits]
   *     summary: Delete credit
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Credit deleted successfully
   *       404:
   *         description: Credit not found
   */
  static deleteCredit = asyncHandler(async (req: Request, res: Response) => {
    const validatedParams: DeleteCreditInput = req as any;
    const orgId = (req as any).orgId;

    const result = await CreditService.deleteCredit(validatedParams.params.id, orgId);

    res.status(200).json(ApiResponse.success(result, 'Credit deleted successfully'));
  });

  /**
   * @swagger
   * /api/credits/{id}/apply:
   *   post:
   *     tags: [Credits]
   *     summary: Apply credit to an invoice or payment
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - amount
   *             properties:
   *               amount:
   *                 type: number
   *                 minimum: 0
   *               description:
   *                 type: string
   *     responses:
   *       200:
   *         description: Credit applied successfully
   *       400:
   *         description: Invalid input or insufficient balance
   *       404:
   *         description: Credit not found
   */
  static applyCredit = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, description } = req.body;
    const orgId = (req as any).orgId;
    const userId = (req as any).userId;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const desc = description || 'Credit applied';
    const result = await CreditService.applyCredit(id, amount, desc, orgId, userId);

    return res.status(200).json(ApiResponse.success(result, 'Credit applied successfully'));
  });

  /**
   * @swagger
   * /api/credits/{creditId}/ledger:
   *   get:
   *     tags: [Credits]
   *     summary: Get credit ledger entries
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: creditId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *     responses:
   *       200:
   *         description: Credit ledger retrieved successfully
   *       404:
   *         description: Credit not found
   */
  static getCreditLedger = asyncHandler(async (req: Request, res: Response) => {
    const validatedData: GetCreditLedgerInput = req as any;
    const orgId = (req as any).orgId;
    const result = await CreditService.getCreditLedger(validatedData.params.creditId, validatedData.query, orgId);

    res.status(200).json(ApiResponse.success(result, 'Credit ledger retrieved successfully'));
  });

  /**
   * @swagger
   * /api/customers/{customerId}/credits/summary:
   *   get:
   *     tags: [Credits]
   *     summary: Get customer credit summary
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: customerId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Customer credit summary retrieved successfully
   *       404:
   *         description: Customer not found
   */
  static getCustomerCreditSummary = asyncHandler(async (req: Request, res: Response) => {
    const { customerId } = req.params;
    const orgId = (req as any).orgId;
    const summary = await CreditService.getCustomerCreditSummary(customerId, orgId);

    res.status(200).json(ApiResponse.success(summary, 'Customer credit summary retrieved successfully'));
  });
}