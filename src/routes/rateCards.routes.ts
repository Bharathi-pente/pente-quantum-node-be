import { Router } from 'express';
import { PricingModelController } from '../controllers/pricingModel.controller';
import { authenticateKeycloak, requireRole } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createPricingModelSchema,
  updatePricingModelSchema,
  getPricingModelSchema,
} from '../validators/pricingModel.validator';

const router = Router();
const pricingModelController = new PricingModelController();

// All routes require authentication
router.use(authenticateKeycloak);

/**
 * @route   POST /api/v1/rate-cards
 * @desc    Create rate card (alias for pricing model)
 * @access  Private (admin)
 */
router.post(
  '/',
  requireRole('admin'),
  validate(createPricingModelSchema),
  pricingModelController.create
);

/**
 * @route   GET /api/v1/rate-cards
 * @desc    Get all rate cards (alias for pricing models)
 * @access  Private
 */
router.get('/', pricingModelController.getAll);

/**
 * @route   GET /api/v1/rate-cards/:id
 * @desc    Get rate card by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(getPricingModelSchema),
  pricingModelController.getById
);

/**
 * @route   PUT /api/v1/rate-cards/:id
 * @desc    Update rate card
 * @access  Private (admin)
 */
router.put(
  '/:id',
  requireRole('admin'),
  validate(updatePricingModelSchema),
  pricingModelController.update
);

/**
 * @route   DELETE /api/v1/rate-cards/:id
 * @desc    Delete rate card
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  requireRole('admin'),
  pricingModelController.delete
);

export default router;