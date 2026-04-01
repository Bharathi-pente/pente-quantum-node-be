import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { TaxService } from '../services/tax.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { CreateTaxConfigInput, UpdateTaxConfigInput } from '../validators/tax.validator';

export class TaxController {
  /**
   * @swagger
   * /api/tax:
   *   get:
   *     tags: [Tax]
   *     summary: Get tax configuration
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Tax configuration retrieved successfully
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
   *                     taxConfig:
   *                       $ref: '#/components/schemas/TaxConfig'
   */
  static getTaxConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const taxConfig = await TaxService.getTaxConfig(orgId);

    return res.json(ApiResponse.success({
      taxConfig
    }, 'Tax configuration retrieved successfully'));
  });

  /**
   * @swagger
   * /api/tax:
   *   post:
   *     tags: [Tax]
   *     summary: Create or update tax configuration
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               enabled:
   *                 type: boolean
   *                 default: false
   *               default_rate:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 1
   *     responses:
   *       200:
   *         description: Tax configuration created/updated successfully
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
   *                     taxConfig:
   *                       $ref: '#/components/schemas/TaxConfig'
   */
  static createTaxConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const data: CreateTaxConfigInput = req.body;
    const taxConfig = await TaxService.upsertTaxConfig(data, orgId);

    return res.json(ApiResponse.success({
      taxConfig
    }, 'Tax configuration created/updated successfully'));
  });

  /**
   * @swagger
   * /api/tax:
   *   put:
   *     tags: [Tax]
   *     summary: Update tax configuration
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               enabled:
   *                 type: boolean
   *               default_rate:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 1
   *     responses:
   *       200:
   *         description: Tax configuration updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                     taxConfig:
   *                       $ref: '#/components/schemas/TaxConfig'
   */
  static updateTaxConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const data: UpdateTaxConfigInput = req.body;
    const taxConfig = await TaxService.updateTaxConfig(data, orgId);

    return res.json(ApiResponse.success({
      taxConfig
    }, 'Tax configuration updated successfully'));
  });
}