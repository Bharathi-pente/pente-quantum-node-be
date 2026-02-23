import { Router } from 'express';
import featureController from '../controllers/feature.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createFeatureSchema,
  updateFeatureSchema,
  getFeatureSchema,
} from '../validators/feature.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/features
 * @desc    Create feature
 * @access  Private (admin)
 */
router.post(
  '/',
  authorize('features.create'),
  validate(createFeatureSchema),
  featureController.create
);

/**
 * @route   GET /api/v1/features
 * @desc    Get all features
 * @access  Private
 */
router.get('/', featureController.getAll);

/**
 * @route   GET /api/v1/features/:id
 * @desc    Get feature by ID
 * @access  Private
 */
router.get('/:id', validate(getFeatureSchema), featureController.getById);

/**
 * @route   PUT /api/v1/features/:id
 * @desc    Update feature
 * @access  Private (admin)
 */
router.put(
  '/:id',
  authorize('features.update'),
  validate(updateFeatureSchema),
  featureController.update
);

/**
 * @route   DELETE /api/v1/features/:id
 * @desc    Delete feature
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  authorize('features.delete'),
  validate(getFeatureSchema),
  featureController.delete
);

export default router;