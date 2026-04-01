import { Router } from 'express';
import adminController from '../controllers/admin.controller';

const router = Router();

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Admin routes
 */

// Keycloak authentication removed — routes are unprotected by Keycloak

router.get('/analytics', adminController.getAnalytics);
router.get('/metrics', adminController.getPlatformMetrics);
router.get('/meters', adminController.getMeters);
router.get('/pricing-models', adminController.getPricingModels);
router.post('/pricing-models', adminController.createPricingModel);
router.put('/pricing-models/:id', adminController.updatePricingModel);
router.get('/mrr-history', adminController.getMrrHistory);
router.get('/revenue-by-plan', adminController.getRevenueByPlan);
router.get('/matrix-pricing', adminController.getMatrixPricing);

export default router;