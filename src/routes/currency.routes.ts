import { Router } from 'express';
import { CurrencyController } from '../controllers/currency.controller';
// import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createCurrencyConfigSchema,
  updateCurrencyConfigSchema,
  getCurrencyConfigSchema
} from '../validators/currency.validator';

const router = Router();

// Keycloak authentication removed — routes are unprotected by Keycloak

/**
 * @swagger
 * /api/currency:
 *   get:
 *     tags: [Currency]
 *     summary: Get currency configuration
 *   post:
 *     tags: [Currency]
 *     summary: Create currency configuration
 *   put:
 *     tags: [Currency]
 *     summary: Update currency configuration
 */
router
  .route('/')
  .get(validate(getCurrencyConfigSchema), CurrencyController.getCurrencyConfig)
  .post(validate(createCurrencyConfigSchema), CurrencyController.createCurrencyConfig)
  .put(validate(updateCurrencyConfigSchema), CurrencyController.updateCurrencyConfig);

/**
 * @swagger
 * /api/currency/refresh-rates:
 *   post:
 *     tags: [Currency]
 *     summary: Refresh exchange rates
 */
router.post('/refresh-rates', CurrencyController.refreshExchangeRates);

export default router;
