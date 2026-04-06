import { Router } from 'express';
import userController from '../controllers/user.controller';
import { validate } from '../middleware/validation.middleware';
import authMiddleware from '../middleware/keycloakAuth.middleware';
import enrichUserMiddleware from '../middleware/enrichUser.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
} from '../validators/user.validator';

const router = Router();

// Apply authentication to all user routes
router.use(authMiddleware);
router.use(enrichUserMiddleware);

/**
 * @route   POST /api/v1/users
 * @desc    Create user
 * @access  Private
 */
router.post('/', validate(createUserSchema), userController.create);

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
router.put('/:id', validate(updateUserSchema), userController.update);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Private (admin)
 */
router.delete('/:id', validate(getUserSchema), userController.delete);

/**
 * @route   GET /api/v1/user/events/:userId/list
 * @desc    Get user events list from external API
 * @access  Private
 */
router.get('/events/:userId/list', userController.getUserEventsList);

/**
 * @route   GET /api/v1/user/events/token-usage/:userId
 * @desc    Get user token usage metrics from external API
 * @access  Private
 */
router.get('/events/token-usage/:userId', userController.getUserTokenUsage);

export default router;
