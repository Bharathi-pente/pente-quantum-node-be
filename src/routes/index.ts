import { Router } from 'express';
import authRoutes from './auth.routes';
import organizationRoutes from './organization.routes';
import userRoutes from './user.routes';
import customerRoutes from './customer.routes';
import productRoutes from './product.routes';
import featureRoutes from './feature.routes';
import meterRoutes from './meter.routes';
import pricingModelRoutes from './pricingModel.routes';
import invoiceRoutes from './invoice.routes';
import paymentRoutes from './payment.routes';
import usageLimitRoutes from './usageLimit.routes';
import creditRoutes from './credit.routes';

const router = Router();

/**
 * Health check endpoint
 * @route GET /api/v1/health
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'QuantumBilling API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/features', featureRoutes);
router.use('/meters', meterRoutes);
router.use('/pricing-models', pricingModelRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/usage-limits', usageLimitRoutes);
router.use('/credits', creditRoutes);

export default router;
