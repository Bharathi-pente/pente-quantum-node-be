import { Router } from 'express';
import organizationController from '../controllers/organization.controller';
import customerController from '../controllers/customer.controller';
import invoiceController from '../controllers/invoice.controller';
import { AlertsController } from '../controllers/alerts.controller';
import { validate } from '../middleware/validation.middleware';
import authMiddleware from '../middleware/keycloakAuth.middleware';
import enrichUserMiddleware from '../middleware/enrichUser.middleware';
import { requireRole, ROLES } from '../middleware/keycloakRole.middleware';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  getOrganizationSchema,
} from '../validators/organization.validator';
import { getOrganizationInvoicesQuerySchema } from '../validators/invoice.validator';
import {
  createAlertSchema,
  updateAlertSchema,
  getAlertSchema,
  getAlertsByOrgSchema,
} from '../validators/alerts.validator';

const router = Router();
const alertsController = new AlertsController();

// Apply authentication and user enrichment to all organization routes
router.use(authMiddleware);
router.use(enrichUserMiddleware);

/**
 * @route   POST /api/v1/organizations
 * @desc    Create organization
 * @access  Private (Super Admin only)
 */
router.post('/', requireRole(ROLES.ADMIN), validate(createOrganizationSchema), organizationController.create);

// Organization routes with Keycloak authentication

/**
 * @route   GET /api/v1/organizations
 * @desc    Get all organizations (filtered by user)
 * @access  Private
 */
router.get('/', organizationController.getAll);

/**
 * @route   GET /api/v1/organizations/:id
 * @desc    Get organization by ID
 * @access  Private
 */
router.get('/:id', validate(getOrganizationSchema), organizationController.getById);

/**
 * @route   PUT /api/v1/organizations/:id
 * @desc    Update organization
 * @access  Private (admin)
 */
router.put('/:id', validate(updateOrganizationSchema), organizationController.update);

/**
 * @route   GET /api/v1/organizations/:id/dashboard
 * @desc    Get organization dashboard data
 * @access  Private
 */
router.get(
  '/:id/dashboard',
  validate(getOrganizationSchema),
  organizationController.getDashboard
);

/**
 * @route   DELETE /api/v1/organizations/:id
 * @desc    Delete organization
 * @access  Private (admin)
 */
router.delete('/:id', validate(getOrganizationSchema), organizationController.delete);

/**
 * @route   GET /api/v1/organizations/:id/invoices
 * @desc    Get all invoices for an organization
 * @access  Private
 */
router.get(
  '/:id/invoices',
  validate(getOrganizationSchema),
  validate(getOrganizationInvoicesQuerySchema),
  invoiceController.getByOrganization
);

/**
 * @route   GET /api/v1/organizations/:id/customers
 * @desc    Get all customers for an organization
 * @access  Private
 */
router.get(
  '/:id/customers',
  validate(getOrganizationSchema),
  customerController.getAll
);

/**
 * @route   POST /api/v1/organizations/:orgId/alerts
 * @desc    Create alert
 * @access  Private
 */
router.post(
  '/:orgId/alerts',
  validate(getAlertsByOrgSchema),
  validate(createAlertSchema),
  alertsController.create
);

/**
 * @route   GET /api/v1/organizations/:orgId/alerts
 * @desc    Get all alerts for an organization
 * @access  Private
 */
router.get(
  '/:orgId/alerts',
  validate(getAlertsByOrgSchema),
  alertsController.getByOrgId
);

/**
 * @route   GET /api/v1/organizations/:orgId/alerts/:id
 * @desc    Get alert by ID
 * @access  Private
 */
router.get(
  '/:orgId/alerts/:id',
  validate(getAlertSchema),
  alertsController.getById
);

/**
 * @route   PUT /api/v1/organizations/:orgId/alerts/:id
 * @desc    Update alert
 * @access  Private
 */
router.put(
  '/:orgId/alerts/:id',
  validate(getAlertSchema),
  validate(updateAlertSchema),
  alertsController.update
);

/**
 * @route   DELETE /api/v1/organizations/:orgId/alerts/:id
 * @desc    Delete alert
 * @access  Private
 */
router.delete(
  '/:orgId/alerts/:id',
  validate(getAlertSchema),
  alertsController.delete
);

/**
 * @route   GET /api/v1/organizations/:orgId/alerts/:id/history
 * @desc    Get alert history
 * @access  Private
 */
router.get(
  '/:orgId/alerts/:id/history',
  validate(getAlertSchema),
  alertsController.getHistory
);

/**
 * @route   GET /api/v1/organizations/:orgId/alerts/history
 * @desc    Get organization alert history
 * @access  Private
 */
router.get(
  '/:orgId/alerts/history',
  alertsController.getOrganizationHistory
);

export default router;
