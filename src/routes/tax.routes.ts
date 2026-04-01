import { Router } from 'express';
import { TaxController } from '../controllers/tax.controller';
// import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createTaxConfigSchema,
  updateTaxConfigSchema,
  getTaxConfigSchema
} from '../validators/tax.validator';
import taxRegionRoutes from './taxRegion.routes';
import taxExemptionRoutes from './taxExemption.routes';

const router = Router();

// Keycloak authentication removed — routes are unprotected by Keycloak

// Mount sub-routes
router.use('/regions', taxRegionRoutes);
router.use('/exemptions', taxExemptionRoutes);

/**
 * @swagger
 * /api/tax:
 *   get:
 *     tags: [Tax]
 *     summary: Get tax configuration
 *   post:
 *     tags: [Tax]
 *     summary: Create or update tax configuration
 *   put:
 *     tags: [Tax]
 *     summary: Update tax configuration
 */
router
  .route('/')
  .get(validate(getTaxConfigSchema), TaxController.getTaxConfig)
  .post(validate(createTaxConfigSchema), TaxController.createTaxConfig)
  .put(validate(updateTaxConfigSchema), TaxController.updateTaxConfig);

export default router;