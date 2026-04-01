import { Router } from 'express';
import { TaxExemptionController } from '../controllers/taxExemption.controller';
// import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createTaxExemptionSchema,
  updateTaxExemptionSchema,
  getTaxExemptionsSchema,
  getTaxExemptionByIdSchema,
  deleteTaxExemptionSchema
} from '../validators/taxExemption.validator';

const router = Router();

// Keycloak authentication removed — routes are unprotected by Keycloak

/**
 * @swagger
 * /api/tax/exemptions:
 *   get:
 *     tags: [Tax]
 *     summary: Get all tax exemptions
 *   post:
 *     tags: [Tax]
 *     summary: Create a new tax exemption
 */
router
  .route('/')
  .get(validate(getTaxExemptionsSchema), TaxExemptionController.getTaxExemptions)
  .post(validate(createTaxExemptionSchema), TaxExemptionController.createTaxExemption);

/**
 * @swagger
 * /api/tax/exemptions/{id}:
 *   get:
 *     tags: [Tax]
 *     summary: Get tax exemption by ID
 *   put:
 *     tags: [Tax]
 *     summary: Update tax exemption
 *   delete:
 *     tags: [Tax]
 *     summary: Delete tax exemption
 */
router
  .route('/:id')
  .get(validate(getTaxExemptionByIdSchema), TaxExemptionController.getTaxExemptionById)
  .put(validate(updateTaxExemptionSchema), TaxExemptionController.updateTaxExemption)
  .delete(validate(deleteTaxExemptionSchema), TaxExemptionController.deleteTaxExemption);

export default router;