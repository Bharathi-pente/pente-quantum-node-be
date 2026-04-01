import { Router } from 'express';
import pricingModelController from '../controllers/pricingModel.controller';
import { validate } from '../middleware/validation.middleware';
import {
  createPricingModelSchema,
  updatePricingModelSchema,
  getPricingModelSchema,
} from '../validators/pricingModel.validator';

const router = Router();

// Keycloak authentication removed — routes are unprotected by Keycloak

/**
 * @route   POST /api/v1/pricing-models
 * @desc    Create pricing model
 * @access  Private (admin)
 */
router.post('/', validate(createPricingModelSchema), pricingModelController.create);

/**
 * @route   GET /api/v1/pricing-models
 * @desc    Get all pricing models
 * @access  Private
 */
router.get('/', pricingModelController.getAll);

/**
 * @route   GET /api/v1/pricing-models/:id
 * @desc    Get pricing model by ID
 * @access  Private
 */
router.get('/:id', validate(getPricingModelSchema), pricingModelController.getById);

/**
 * @route   PUT /api/v1/pricing-models/:id
 * @desc    Update pricing model
 * @access  Private (admin)
 */
router.put('/:id', validate(updatePricingModelSchema), pricingModelController.update);

/**
 * @route   DELETE /api/v1/pricing-models/:id
 * @desc    Delete pricing model
 * @access  Private (admin)
 */
router.delete('/:id', validate(getPricingModelSchema), pricingModelController.delete);

export default router;