import { Router } from 'express';
import dunningController from '../controllers/dunning.controller';
import { validate } from '../middleware/validation.middleware';
import {
  createDunningPolicySchema,
  updateDunningPolicySchema,
  getDunningPolicySchema,
  createDunningStepSchema,
  updateDunningStepSchema,
} from '../validators/dunning.validator';

const router = Router();

// Keycloak authentication removed — routes are unprotected by Keycloak

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
router.post('/policies', validate(createDunningPolicySchema), dunningController.createPolicy);

/**
 * @route   PUT /api/v1/dunning/policies/:id
 * @desc    Update dunning policy
 * @access  Private (Admin/Finance)
 */
router.put('/policies/:id', validate(updateDunningPolicySchema), dunningController.updatePolicy);

/**
 * @route   DELETE /api/v1/dunning/policies/:id
 * @desc    Delete dunning policy
 * @access  Private (Admin)
 */
router.delete('/policies/:id', validate(getDunningPolicySchema), dunningController.deletePolicy);

/**
 * @route   POST /api/v1/dunning/steps
 * @desc    Create dunning step
 * @access  Private (Admin/Finance)
 */
router.post('/steps', validate(createDunningStepSchema), dunningController.createStep);

/**
 * @route   PUT /api/v1/dunning/steps/:id
 * @desc    Update dunning step
 * @access  Private (Admin/Finance)
 */
router.put('/steps/:id', validate(updateDunningStepSchema), dunningController.updateStep);

/**
 * @route   DELETE /api/v1/dunning/steps/:id
 * @desc    Delete dunning step
 * @access  Private (Admin/Finance)
 */
router.delete('/steps/:id', dunningController.deleteStep);

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
router.post('/workflows/start', dunningController.startDunningWorkflow);

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
router.post('/workflows/:workflowId/signal', dunningController.sendWorkflowSignal);

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
router.post('/send-reminder/:invoiceId', dunningController.sendManualReminder);

export default router;