import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { TaxRegionService } from '../services/taxRegion.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { CreateTaxRegionInput, UpdateTaxRegionInput, GetTaxRegionsInput } from '../validators/taxRegion.validator';

export class TaxRegionController {
  /**
   * @swagger
   * /api/tax/regions:
   *   get:
   *     tags: [Tax]
   *     summary: Get all tax regions
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive]
   *       - in: query
   *         name: country_code
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Tax regions retrieved successfully
   */
  static getTaxRegions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const filters: GetTaxRegionsInput = req.query;
    const regions = await TaxRegionService.getTaxRegions(orgId, filters);

    return res.json(ApiResponse.success({
      regions,
      total: regions.length
    }, 'Tax regions retrieved successfully'));
  });

  /**
   * @swagger
   * /api/tax/regions/{id}:
   *   get:
   *     tags: [Tax]
   *     summary: Get tax region by ID
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
   *         description: Tax region retrieved successfully
   */
  static getTaxRegionById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const { id } = req.params;
    const region = await TaxRegionService.getTaxRegionById(id, orgId);

    return res.json(ApiResponse.success({
      region
    }, 'Tax region retrieved successfully'));
  });

  /**
   * @swagger
   * /api/tax/regions:
   *   post:
   *     tags: [Tax]
   *     summary: Create a new tax region
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - country_code
   *               - rate
   *               - name
   *               - tax_type
   *             properties:
   *               country_code:
   *                 type: string
   *                 maxLength: 2
   *               state_code:
   *                 type: string
   *               rate:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 1
   *               name:
   *                 type: string
   *               tax_type:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *                 default: active
   *     responses:
   *       201:
   *         description: Tax region created successfully
   */
  static createTaxRegion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const data: CreateTaxRegionInput = req.body;
    const region = await TaxRegionService.createTaxRegion(data, orgId);

    return res.status(201).json(ApiResponse.success({
      region
    }, 'Tax region created successfully'));
  });

  /**
   * @swagger
   * /api/tax/regions/{id}:
   *   put:
   *     tags: [Tax]
   *     summary: Update tax region
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
   *               country_code:
   *                 type: string
   *                 maxLength: 2
   *               state_code:
   *                 type: string
   *               rate:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 1
   *               name:
   *                 type: string
   *               tax_type:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *     responses:
   *       200:
   *         description: Tax region updated successfully
   */
  static updateTaxRegion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const { id } = req.params;
    const data: UpdateTaxRegionInput = req.body;
    const region = await TaxRegionService.updateTaxRegion(id, data, orgId);

    return res.json(ApiResponse.success({
      region
    }, 'Tax region updated successfully'));
  });

  /**
   * @swagger
   * /api/tax/regions/{id}:
   *   delete:
   *     tags: [Tax]
   *     summary: Delete tax region
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
   *         description: Tax region deleted successfully
   */
  static deleteTaxRegion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const { id } = req.params;
    const result = await TaxRegionService.deleteTaxRegion(id, orgId);

    return res.json(ApiResponse.success(null, result.message));
  });
}
