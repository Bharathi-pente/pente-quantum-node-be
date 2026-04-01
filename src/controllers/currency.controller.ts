import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { CurrencyService } from '../services/currency.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { CreateCurrencyConfigInput, UpdateCurrencyConfigInput } from '../validators/currency.validator';

export class CurrencyController {
  /**
   * @swagger
   * /api/currency:
   *   get:
   *     tags: [Currency]
   *     summary: Get currency configuration
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Currency configuration retrieved
   */
  static getCurrencyConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const config = await CurrencyService.getCurrencyConfig(orgId);

    return res.json(ApiResponse.success({ currencyConfig: config }));
  });

  /**
   * @swagger
   * /api/currency:
   *   post:
   *     tags: [Currency]
   *     summary: Create currency configuration
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               base_currency:
   *                 type: string
   *               supported_currencies:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: Currency configuration created
   */
  static createCurrencyConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const data: CreateCurrencyConfigInput = req.body;
    const config = await CurrencyService.createCurrencyConfig(data, orgId);

    return res.status(201).json(ApiResponse.success({
      currencyConfig: config
    }, 'Currency configuration created successfully'));
  });

  /**
   * @swagger
   * /api/currency:
   *   put:
   *     tags: [Currency]
   *     summary: Update currency configuration
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Currency configuration updated
   */
  static updateCurrencyConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const data: UpdateCurrencyConfigInput = req.body;
    const config = await CurrencyService.updateCurrencyConfig(data, orgId);

    return res.json(ApiResponse.success({
      currencyConfig: config
    }, 'Currency configuration updated successfully'));
  });

  /**
   * @swagger
   * /api/currency/refresh-rates:
   *   post:
   *     tags: [Currency]
   *     summary: Refresh exchange rates
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Exchange rates refreshed
   */
  static refreshExchangeRates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const config = await CurrencyService.refreshExchangeRates(orgId);

    return res.json(ApiResponse.success({
      currencyConfig: config
    }, 'Exchange rates refreshed successfully'));
  });
}
