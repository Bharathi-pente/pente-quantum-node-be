import { Router } from 'express';
import { TaxRegionController } from '../controllers/taxRegion.controller';
import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createTaxRegionSchema,
  updateTaxRegionSchema,
  getTaxRegionsSchema,
  getTaxRegionByIdSchema,
  deleteTaxRegionSchema
} from '../validators/taxRegion.validator';

const router = Router();

// All tax region routes require authentication
router.use(authenticateKeycloak);

/**
 * @swagger
 * /api/tax/regions:
 *   get:
 *     tags: [Tax]
 *     summary: Get all tax regions
 *   post:
 *     tags: [Tax]
 *     summary: Create a new tax region
 */
router
  .route('/')
  .get(validate(getTaxRegionsSchema), TaxRegionController.getTaxRegions)
  .post(validate(createTaxRegionSchema), TaxRegionController.createTaxRegion);

/**
 * @swagger
 * /api/tax/regions/{id}:
 *   get:
 *     tags: [Tax]
 *     summary: Get tax region by ID
 *   put:
 *     tags: [Tax]
 *     summary: Update tax region
 *   delete:
 *     tags: [Tax]
 *     summary: Delete tax region
 */
router
  .route('/:id')
  .get(validate(getTaxRegionByIdSchema), TaxRegionController.getTaxRegionById)
  .put(validate(updateTaxRegionSchema), TaxRegionController.updateTaxRegion)
  .delete(validate(deleteTaxRegionSchema), TaxRegionController.deleteTaxRegion);

export default router;