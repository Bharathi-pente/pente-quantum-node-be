import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { TaxExemptionService } from '../services/taxExemption.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { CreateTaxExemptionInput, UpdateTaxExemptionInput, GetTaxExemptionsInput } from '../validators/taxExemption.validator';

export class TaxExemptionController {
  /**
   * @swagger
   * /api/tax/exemptions:
   *   get:
   *     tags: [Tax]
   *     summary: Get all tax exemptions
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
   *           enum: [active, expired]
   *     responses:
   *       200:
   *         description: Tax exemptions retrieved successfully
   */
  static getTaxExemptions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const filters: GetTaxExemptionsInput = req.query;
    const exemptions = await TaxExemptionService.getTaxExemptions(orgId, filters);

    return res.json(ApiResponse.success({
      exemptions,
      total: exemptions.length
    }, 'Tax exemptions retrieved successfully'));
  });

  /**
   * @swagger
   * /api/tax/exemptions/{id}:
   *   get:
   *     tags: [Tax]
   *     summary: Get tax exemption by ID
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
   *         description: Tax exemption retrieved successfully
   */
  static getTaxExemptionById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const { id } = req.params;
    const exemption = await TaxExemptionService.getTaxExemptionById(id, orgId);

    return res.json(ApiResponse.success({
      exemption
    }, 'Tax exemption retrieved successfully'));
  });

  /**
   * @swagger
   * /api/tax/exemptions:
   *   post:
   *     tags: [Tax]
   *     summary: Create a new tax exemption
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
   *               - reason
   *             properties:
   *               customer_id:
   *                 type: string
   *                 format: uuid
   *               reason:
   *                 type: string
   *               certificate_id:
   *                 type: string
   *               expires_at:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       201:
   *         description: Tax exemption created successfully
   */
  static createTaxExemption = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const data: CreateTaxExemptionInput = req.body;
    const exemption = await TaxExemptionService.createTaxExemption(data, orgId);

    return res.status(201).json(ApiResponse.success({
      exemption
    }, 'Tax exemption created successfully'));
  });

  /**
   * @swagger
   * /api/tax/exemptions/{id}:
   *   put:
   *     tags: [Tax]
   *     summary: Update tax exemption
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
   *               reason:
   *                 type: string
   *               certificate_id:
   *                 type: string
   *               expires_at:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       200:
   *         description: Tax exemption updated successfully
   */
  static updateTaxExemption = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const { id } = req.params;
    const data: UpdateTaxExemptionInput = req.body;
    const exemption = await TaxExemptionService.updateTaxExemption(id, data, orgId);

    return res.json(ApiResponse.success({
      exemption
    }, 'Tax exemption updated successfully'));
  });

  /**
   * @swagger
   * /api/tax/exemptions/{id}:
   *   delete:
   *     tags: [Tax]
   *     summary: Delete tax exemption
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
   *         description: Tax exemption deleted successfully
   */
  static deleteTaxExemption = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const { id } = req.params;
    const result = await TaxExemptionService.deleteTaxExemption(id, orgId);

    return res.json(ApiResponse.success(null, result.message));
  });
}
