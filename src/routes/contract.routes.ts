import { Router } from 'express';
import contractController from '../controllers/contract.controller';
import { validate } from '../middleware/validation.middleware';
import {
  createContractSchema,
  updateContractSchema,
  getContractSchema,
  getContractsQuerySchema,
} from '../validators/contract.validator';

const router = Router();

/**
 * @route   POST /api/v1/contracts
 * @desc    Create contract
 * @access  Private (authenticated users)
 */
router.post('/', validate(createContractSchema), contractController.create);

/**
 * @route   GET /api/v1/contracts
 * @desc    Get all contracts for organization
 * @access  Private (authenticated users)
 */
router.get('/', validate(getContractsQuerySchema), contractController.getAll);

/**
 * @route   GET /api/v1/contracts/:id
 * @desc    Get contract by ID
 * @access  Private (authenticated users)
 */
router.get('/:id', validate(getContractSchema), contractController.getById);

/**
 * @route   PUT /api/v1/contracts/:id
 * @desc    Update contract
 * @access  Private (admin role required)
 */
router.put('/:id', validate(updateContractSchema), contractController.update);

/**
 * @route   DELETE /api/v1/contracts/:id
 * @desc    Delete contract
 * @access  Private (admin role required)
 */
router.delete('/:id', validate(getContractSchema), contractController.delete);

export default router;