/**
 * Monitoring Routes
 * 
 * Routes for application monitoring and health checks
 */

import { Router } from 'express';
import monitoringController from '../controllers/monitoring.controller';
import { authenticateKeycloak, requireRole } from '../middleware/keycloakAuth.middleware';

const router = Router();

// All monitoring routes require admin authentication
router.use(authenticateKeycloak);
router.use(requireRole('admin'));

/**
 * @route   GET /api/v1/monitoring/metrics
 * @desc    Get performance metrics
 * @access  Private (Admin only)
 */
router.get('/metrics', monitoringController.getMetrics);

/**
 * @route   GET /api/v1/monitoring/metrics/recent
 * @desc    Get recent request metrics
 * @access  Private (Admin only)
 */
router.get('/metrics/recent', monitoringController.getRecentRequests);

/**
 * @route   GET /api/v1/monitoring/health
 * @desc    Get system health information
 * @access  Private (Admin only)
 */
router.get('/health', monitoringController.getHealth);

/**
 * @route   DELETE /api/v1/monitoring/cache
 * @desc    Clear application cache
 * @access  Private (Admin only)
 */
router.delete('/cache', monitoringController.clearCache);

export default router;
