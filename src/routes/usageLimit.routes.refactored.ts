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
// import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
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
  validate(createUsageLimitSchema), 
  usageLimitCrudController.create
);

router.get(
  '/', 
  validate(getUsageLimitsQuerySchema), 
  usageLimitCrudController.getAll
);

router.get(
  '/:id', 
  validate(getUsageLimitSchema), 
  usageLimitCrudController.getById
);

router.put(
  '/:id', 
  validate(updateUsageLimitSchema), 
  usageLimitCrudController.update
);

router.delete(
  '/:id', 
  validate(getUsageLimitSchema), 
  usageLimitCrudController.delete
);

// ═══════════════════════════════════════════════════════════
// LIMIT OVERRIDE ROUTES
// ═══════════════════════════════════════════════════════════

router.post(
  '/overrides', 
  validate(createLimitOverrideSchema), 
  usageLimitOverrideController.create
);

router.get(
  '/overrides', 
  validate(getLimitOverridesQuerySchema), 
  usageLimitOverrideController.getAll
);

router.get(
  '/overrides/:id', 
  validate(getLimitOverrideSchema), 
  usageLimitOverrideController.getById
);

router.put(
  '/overrides/:id', 
  validate(updateLimitOverrideSchema), 
  usageLimitOverrideController.update
);

router.delete(
  '/overrides/:id', 
  validate(getLimitOverrideSchema), 
  usageLimitOverrideController.delete
);

// ═══════════════════════════════════════════════════════════
// USAGE TRACKING ROUTES
// ═══════════════════════════════════════════════════════════

router.get(
  '/current-usage', 
  validate(getCurrentUsageQuerySchema), 
  usageLimitTrackingController.getCurrentUsage
);

router.get(
  '/:id/current-usage', 
  validate(getUsageLimitSchema), 
  usageLimitTrackingController.getLimitUsage
);

router.get(
  '/usage-stats', 
  validate(getUsageStatsQuerySchema), 
  usageLimitTrackingController.getStats
);

export default router;
