import { Router } from 'express';
import dunningController from '../controllers/dunning.controller';
import { authenticateKeycloak, requireRole } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createDunningPolicySchema,
  updateDunningPolicySchema,
  getDunningPolicySchema,
  createDunningStepSchema,
  updateDunningStepSchema,
} from '../validators/dunning.validator';

const router = Router();

// All routes require authentication
router.use(authenticateKeycloak);

/**
 * @route   GET /api/v1/dunning/policies
 * @desc    Get all dunning policies
 * @access  Private
 */
router.get('/policies', dunningController.getPolicies);

/**
 * @route   GET /api/v1/dunning/policies/:id
 * @desc    Get dunning policy by ID
 * @access  Private
 */
router.get('/policies/:id', validate(getDunningPolicySchema), dunningController.getPolicyById);

/**
 * @route   POST /api/v1/dunning/policies
 * @desc    Create dunning policy
 * @access  Private (Admin/Finance)
 */
router.post(
  '/policies',
  requireRole('admin', 'finance'),
  validate(createDunningPolicySchema),
  dunningController.createPolicy
);

/**
 * @route   PUT /api/v1/dunning/policies/:id
 * @desc    Update dunning policy
 * @access  Private (Admin/Finance)
 */
router.put(
  '/policies/:id',
  requireRole('admin', 'finance'),
  validate(updateDunningPolicySchema),
  dunningController.updatePolicy
);

/**
 * @route   DELETE /api/v1/dunning/policies/:id
 * @desc    Delete dunning policy
 * @access  Private (Admin)
 */
router.delete(
  '/policies/:id',
  requireRole('admin'),
  validate(getDunningPolicySchema),
  dunningController.deletePolicy
);

/**
 * @route   POST /api/v1/dunning/steps
 * @desc    Create dunning step
 * @access  Private (Admin/Finance)
 */
router.post(
  '/steps',
  requireRole('admin', 'finance'),
  validate(createDunningStepSchema),
  dunningController.createStep
);

/**
 * @route   PUT /api/v1/dunning/steps/:id
 * @desc    Update dunning step
 * @access  Private (Admin/Finance)
 */
router.put(
  '/steps/:id',
  requireRole('admin', 'finance'),
  validate(updateDunningStepSchema),
  dunningController.updateStep
);

/**
 * @route   DELETE /api/v1/dunning/steps/:id
 * @desc    Delete dunning step
 * @access  Private (Admin/Finance)
 */
router.delete(
  '/steps/:id',
  requireRole('admin', 'finance'),
  dunningController.deleteStep
);

/**
 * @route   GET /api/v1/dunning/overdue-invoices
 * @desc    Get overdue invoices for dunning
 * @access  Private
 */
router.get('/overdue-invoices', dunningController.getOverdueInvoices);

/**
 * @route   POST /api/v1/dunning/workflows/start
 * @desc    Start a dunning workflow
 * @access  Private (Admin/Finance)
 */
router.post(
  '/workflows/start',
  requireRole('admin', 'finance'),
  dunningController.startDunningWorkflow
);

/**
 * @route   GET /api/v1/dunning/workflows/:workflowId/status
 * @desc    Get workflow status
 * @access  Private
 */
router.get('/workflows/:workflowId/status', dunningController.getWorkflowStatus);

/**
 * @route   POST /api/v1/dunning/workflows/:workflowId/signal
 * @desc    Send signal to workflow
 * @access  Private (Admin/Finance)
 */
router.post(
  '/workflows/:workflowId/signal',
  requireRole('admin', 'finance'),
  dunningController.sendWorkflowSignal
);

/**
 * @route   GET /api/v1/dunning/workflows/:workflowId/query
 * @desc    Query workflow status
 * @access  Private
 */
router.get('/workflows/:workflowId/query', dunningController.queryWorkflowStatus);

/**
 * @route   POST /api/v1/dunning/send-reminder/:invoiceId
 * @desc    Send manual reminder email for invoice
 * @access  Private (Admin/Finance)
 */
router.post(
  '/send-reminder/:invoiceId',
  requireRole('admin', 'finance'),
  dunningController.sendManualReminder
);

export default router;