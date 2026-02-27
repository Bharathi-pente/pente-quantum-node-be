/**
 * Usage Limit Routes (Refactored)
 * 
 * Routes now organized by controller responsibility:
 * - CRUD operations → usageLimitCrud.controller
 * - Override management → usageLimitOverride.controller  
 * - Usage tracking → usageLimitTracking.controller
 */

import { Router } from 'express';
import usageLimitCrudController from '../controllers/usageLimitCrud.controller';
import usageLimitOverrideController from '../controllers/usageLimitOverride.controller';
import usageLimitTrackingController from '../controllers/usageLimitTracking.controller';
import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createUsageLimitSchema,
  updateUsageLimitSchema,
  getUsageLimitSchema,
  getUsageLimitsQuerySchema,
  createLimitOverrideSchema,
  updateLimitOverrideSchema,
  getLimitOverrideSchema,
  getLimitOverridesQuerySchema,
  getCurrentUsageQuerySchema,
  getUsageStatsQuerySchema,
} from '../validators/usageLimit.validator';

const router = Router();

// ═══════════════════════════════════════════════════════════
// USAGE LIMIT CRUD ROUTES
// ═══════════════════════════════════════════════════════════

router.post(
  '/', 
  authenticateKeycloak, 
  validate(createUsageLimitSchema), 
  usageLimitCrudController.create
);

router.get(
  '/', 
  authenticateKeycloak, 
  validate(getUsageLimitsQuerySchema), 
  usageLimitCrudController.getAll
);

router.get(
  '/:id', 
  authenticateKeycloak, 
  validate(getUsageLimitSchema), 
  usageLimitCrudController.getById
);

router.put(
  '/:id', 
  authenticateKeycloak, 
  validate(updateUsageLimitSchema), 
  usageLimitCrudController.update
);

router.delete(
  '/:id', 
  authenticateKeycloak, 
  validate(getUsageLimitSchema), 
  usageLimitCrudController.delete
);

// ═══════════════════════════════════════════════════════════
// LIMIT OVERRIDE ROUTES
// ═══════════════════════════════════════════════════════════

router.post(
  '/overrides', 
  authenticateKeycloak, 
  validate(createLimitOverrideSchema), 
  usageLimitOverrideController.create
);

router.get(
  '/overrides', 
  authenticateKeycloak, 
  validate(getLimitOverridesQuerySchema), 
  usageLimitOverrideController.getAll
);

router.get(
  '/overrides/:id', 
  authenticateKeycloak, 
  validate(getLimitOverrideSchema), 
  usageLimitOverrideController.getById
);

router.put(
  '/overrides/:id', 
  authenticateKeycloak, 
  validate(updateLimitOverrideSchema), 
  usageLimitOverrideController.update
);

router.delete(
  '/overrides/:id', 
  authenticateKeycloak, 
  validate(getLimitOverrideSchema), 
  usageLimitOverrideController.delete
);

// ═══════════════════════════════════════════════════════════
// USAGE TRACKING ROUTES
// ═══════════════════════════════════════════════════════════

router.get(
  '/current-usage', 
  authenticateKeycloak, 
  validate(getCurrentUsageQuerySchema), 
  usageLimitTrackingController.getCurrentUsage
);

router.get(
  '/:id/current-usage', 
  authenticateKeycloak, 
  validate(getUsageLimitSchema), 
  usageLimitTrackingController.getLimitUsage
);

router.get(
  '/usage-stats', 
  authenticateKeycloak, 
  validate(getUsageStatsQuerySchema), 
  usageLimitTrackingController.getStats
);

export default router;
