import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';

const router = Router();

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Admin routes
 */

// Apply authentication to all admin routes
router.use(authenticateKeycloak);

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