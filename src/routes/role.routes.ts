import express from 'express';
import roleController from '../controllers/role.controller';
import { validate } from '../middleware/validation.middleware';
import { createRoleSchema, updateRoleSchema } from '../validators/role.validator';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management endpoints
 */

/**
 * @route   POST /api/v1/roles
 * @desc    Create a new role
 * @access  Private (admin)
 */
router.post('/', validate(createRoleSchema), roleController.create);

/**
 * @route   GET /api/v1/roles
 * @desc    Get all roles
 * @access  Private
 */
router.get('/', roleController.getAll);

/**
 * @route   GET /api/v1/roles/permissions
 * @desc    Get available permissions
 * @access  Private
 */
router.get('/permissions', roleController.getPermissions);

/**
 * @route   GET /api/v1/roles/:id
 * @desc    Get role by ID
 * @access  Private
 */
router.get('/:id', roleController.getById);

/**
 * @route   PUT /api/v1/roles/:id
 * @desc    Update role
 * @access  Private (admin)
 */
router.put('/:id', validate(updateRoleSchema), roleController.update);

/**
 * @route   DELETE /api/v1/roles/:id
 * @desc    Delete role
 * @access  Private (admin)
 */
router.delete('/:id', roleController.delete);

export default router;