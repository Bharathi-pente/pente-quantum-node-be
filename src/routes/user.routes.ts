import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticateKeycloak, requireRole } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
} from '../validators/user.validator';

const router = Router();

/**
 * @route   POST /api/v1/users
 * @desc    Create user
 * @access  Private
 */
router.post(
  '/',
  authenticateKeycloak,
  validate(createUserSchema),
  userController.create
);

// All routes require authentication
router.use(authenticateKeycloak);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private
 */
router.get('/', userController.getAll);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', validate(getUserSchema), userController.getById);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (admin or self)
 */
router.put(
  '/:id',
  requireRole('admin'),
  validate(updateUserSchema),
  userController.update
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  requireRole('admin'),
  validate(getUserSchema),
  userController.delete
);

export default router;
