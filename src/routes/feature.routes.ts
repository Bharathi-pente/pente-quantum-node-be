import { Router } from 'express';
import featureController from '../controllers/feature.controller';
import { validate } from '../middleware/validation.middleware';
import {
  createFeatureSchema,
  updateFeatureSchema,
  getFeatureSchema,
} from '../validators/feature.validator';

const router = Router();

// Keycloak authentication removed — routes are unprotected by Keycloak

/**
 * @route   POST /api/v1/features
 * @desc    Create feature
 * @access  Private (admin)
 */
router.post('/', validate(createFeatureSchema), featureController.create);

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
router.put('/:id', validate(updateFeatureSchema), featureController.update);

/**
 * @route   DELETE /api/v1/features/:id
 * @desc    Delete feature
 * @access  Private (admin)
 */
router.delete('/:id', validate(getFeatureSchema), featureController.delete);

export default router;