import { Router } from 'express';
import entitlementController from '../controllers/entitlement.controller';
import { validate } from '../middleware/validation.middleware';
import {
  createEntitlementGrantSchema,
  updateEntitlementGrantSchema,
  getEntitlementGrantSchema,
  getEntitlementGrantsSchema,
  checkEntitlementSchema,
} from '../validators/entitlement.validator';

const router = Router();

// Keycloak authentication removed — routes are unprotected by Keycloak

/**
 * @route   POST /api/v1/entitlement-grants
 * @desc    Create entitlement grant
 * @access  Private (admin)
 */
router.post('/entitlement-grants', validate(createEntitlementGrantSchema), entitlementController.createGrant);

/**
 * @route   GET /api/v1/entitlement-grants
 * @desc    Get all entitlement grants
 * @access  Private
 */
router.get(
  '/entitlement-grants',
  validate(getEntitlementGrantsSchema),
  entitlementController.getAllGrants
);

/**
 * @route   GET /api/v1/entitlement-grants/:id
 * @desc    Get entitlement grant by ID
 * @access  Private
 */
router.get(
  '/entitlement-grants/:id',
  validate(getEntitlementGrantSchema),
  entitlementController.getGrantById
);

/**
 * @route   PUT /api/v1/entitlement-grants/:id
 * @desc    Update entitlement grant
 * @access  Private (admin)
 */
router.put('/entitlement-grants/:id', validate(updateEntitlementGrantSchema), entitlementController.updateGrant);

/**
 * @route   DELETE /api/v1/entitlement-grants/:id
 * @desc    Delete entitlement grant
 * @access  Private (admin)
 */
router.delete('/entitlement-grants/:id', validate(getEntitlementGrantSchema), entitlementController.deleteGrant);

/**
 * @route   GET /api/v1/entitlements/check
 * @desc    Check customer entitlement for a feature
 * @access  Private
 */
router.get('/check', validate(checkEntitlementSchema), entitlementController.checkEntitlement);

/**
 * @route   GET /api/v1/plan-features
 * @desc    Get plan features mapping
 * @access  Private
 */
router.get('/plan-features', entitlementController.getPlanFeatures);

export default router;