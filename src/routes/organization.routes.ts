import { Router } from 'express';
import organizationController from '../controllers/organization.controller';
import invoiceController from '../controllers/invoice.controller';
import { authenticateKeycloak, requireRole } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  getOrganizationSchema,
} from '../validators/organization.validator';
import { getOrganizationInvoicesQuerySchema } from '../validators/invoice.validator';

const router = Router();

/**
 * @route   POST /api/v1/organizations
 * @desc    Create organization
 * @access  Public (for initial setup)
 */
router.post(
  '/',
  validate(createOrganizationSchema),
  organizationController.create
);

// All other routes require authentication
router.use(authenticateKeycloak);

/**
 * @route   GET /api/v1/organizations
 * @desc    Get all organizations
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
router.put(
  '/:id',
  requireRole('admin'),
  validate(updateOrganizationSchema),
  organizationController.update
);

/**
 * @route   DELETE /api/v1/organizations/:id
 * @desc    Delete organization
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  requireRole('admin'),
  validate(getOrganizationSchema),
  organizationController.delete
);

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

export default router;
