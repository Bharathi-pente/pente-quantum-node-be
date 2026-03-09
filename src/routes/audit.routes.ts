import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateKeycloak, requireRole } from '../middleware/keycloakAuth.middleware';

const router = Router();
const auditController = new AuditController();

// All audit routes require authentication
router.use(authenticateKeycloak);

/**
 * @route   GET /api/v1/audit/logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Private
 */
router.get('/logs', auditController.getAuditLogs);

/**
 * @route   GET /api/v1/audit/logs/:id
 * @desc    Get audit log by ID
 * @access  Private
 */
router.get('/logs/:id', auditController.getAuditLogById);

/**
 * @route   GET /api/v1/audit/stats
 * @desc    Get audit statistics
 * @access  Private
 */
router.get('/stats', auditController.getAuditStats);

/**
 * @route   GET /api/v1/audit/export
 * @desc    Export audit logs
 * @access  Private (admin only)
 */
router.get('/export', requireRole('admin'), auditController.exportAuditLogs);

export default router;