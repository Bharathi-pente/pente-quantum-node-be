import { Router } from 'express';
import organizationRoutes from './organization.routes';
import userRoutes from './user.routes';
import customerRoutes from './customer.routes';
import productRoutes from './product.routes';
import featureRoutes from './feature.routes';
import meterRoutes from './meter.routes';
import pricingModelRoutes from './pricingModel.routes';
import rateCardsRoutes from './rateCards.routes';
import invoiceRoutes from './invoice.routes';
import paymentRoutes from './payment.routes';
import usageLimitRoutes from './usageLimit.routes';
import creditRoutes from './credit.routes';
import monitoringRoutes from './monitoring.routes';
import adminRoutes from './admin.routes';
import contractRoutes from './contract.routes';
import rateLimitRoutes from './rateLimit.routes';
import taxRoutes from './tax.routes';
import currencyRoutes from './currency.routes';
import webhookRoutes from './webhook.routes';
import paymentMethodRoutes from './paymentMethod.routes';
import usageRoutes from './usage.routes';

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
// Note: Authentication is now handled by Keycloak.
// Old /auth routes (login, register) have been removed.
// Users must authenticate through Keycloak instead.
router.use('/organizations', organizationRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/features', featureRoutes);
router.use('/meters', meterRoutes);
router.use('/pricing-models', pricingModelRoutes);
router.use('/rate-cards', rateCardsRoutes);
router.use('/rate-limit-policies', rateLimitRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/payment-methods', paymentMethodRoutes);
router.use('/usage-limits', usageLimitRoutes);
router.use('/credits', creditRoutes);
router.use('/contracts', contractRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/admin', adminRoutes);
router.use('/tax', taxRoutes);
router.use('/currency', currencyRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/usage-events', usageRoutes);

export default router;
