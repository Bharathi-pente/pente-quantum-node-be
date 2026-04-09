import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import authMiddleware from '../middleware/keycloakAuth.middleware';
import enrichUserMiddleware from '../middleware/enrichUser.middleware';

const router = Router();

// Apply authentication to all admin routes
router.use(authMiddleware);
router.use(enrichUserMiddleware);

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Admin routes
 */

router.get('/analytics', adminController.getAnalytics);
router.get('/metrics', adminController.getPlatformMetrics);
router.get('/meters', adminController.getMeters);
router.get('/pricing-models', adminController.getPricingModels);
router.post('/pricing-models', adminController.createPricingModel);
router.put('/pricing-models/:id', adminController.updatePricingModel);
router.get('/mrr-history', adminController.getMrrHistory);
router.get('/revenue-by-plan', adminController.getRevenueByPlan);
router.get('/matrix-pricing', adminController.getMatrixPricing);
router.get('/products', adminController.getProducts);
router.get('/feature-matrix', adminController.getFeatureMatrix);

// Billing organization management
router.get('/billing/organization', adminController.getBillingOrganization);
router.patch('/billing/organization', adminController.updateBillingOrganization);

export default router;