import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { loginSchema, createUserSchema } from '../validators/user.validator';
import { authLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user (DEPRECATED - use Keycloak)
 * @access  Private
 * @deprecated Use Keycloak authentication instead
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user (DEPRECATED - use Keycloak)
 * @access  Private
 * @deprecated Use Keycloak user management instead
 */
router.post('/register', authLimiter, validate(createUserSchema), authController.register);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user from Keycloak token
 * @access  Private
 */
router.get('/me', authController.getCurrentUser);

/**
 * @route   POST /api/v1/auth/validate
 * @desc    Validate JWT token (DEPRECATED - Keycloak handles this)
 * @access  Private
 * @deprecated Token validation is handled by Keycloak middleware
 */
router.post('/validate', authController.validateToken);

export default router;
