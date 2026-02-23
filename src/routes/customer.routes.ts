import { Router } from 'express';
import customerController from '../controllers/customer.controller';
import invoiceController from '../controllers/invoice.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomerSchema,
} from '../validators/customer.validator';
import { getCustomerInvoicesQuerySchema } from '../validators/invoice.validator';

const router = Router();

/**
 * @route   POST /api/v1/customers
 * @desc    Create customer
 * @access  Public (for testing)
 */
router.post(
  '/',
  validate(createCustomerSchema),
  customerController.create
);

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/customers
 * @desc    Get all customers
 * @access  Private
 */
router.get('/', customerController.getAll);

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get customer by ID
 * @access  Private
 */
router.get('/:id', validate(getCustomerSchema), customerController.getById);

/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Update customer
 * @access  Private
 */
router.put(
  '/:id',
  authorize('customers.update'),
  validate(updateCustomerSchema),
  customerController.update
);

/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Delete customer
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  authorize('customers.delete'),
  validate(getCustomerSchema),
  customerController.delete
);

/**
 * @route   GET /api/v1/customers/:id/invoices
 * @desc    Get all invoices for a customer
 * @access  Private
 */
router.get(
  '/:id/invoices',
  validate(getCustomerSchema),
  validate(getCustomerInvoicesQuerySchema),
  invoiceController.getByCustomer
);

export default router;
