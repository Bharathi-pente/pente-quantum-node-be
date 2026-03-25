import { Router } from 'express';
import apiKeyController from '../controllers/apiKey.controller';
import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';

const router = Router();

// All routes require Keycloak authentication
router.use(authenticateKeycloak);

/**
 * @route   GET /api/v1/user/apikeys
 * @desc    Get all API keys with pagination
 * @access  Protected
 */
router.get('/', apiKeyController.getAll);

/**
 * @route   POST /api/v1/user/apikeys
 * @desc    Create a new API key
 * @access  Protected
 */
router.post('/', apiKeyController.create);

/**
 * @route   GET /api/v1/user/apikeys/:id
 * @desc    Get API key by ID
 * @access  Protected
 */
router.get('/:id', apiKeyController.getById);

/**
 * @route   PUT /api/v1/user/apikeys/:id
 * @desc    Update API key
 * @access  Protected
 */
router.put('/:id', apiKeyController.update);

/**
 * @route   POST /api/v1/user/apikeys/:id/revoke
 * @desc    Revoke an API key
 * @access  Protected
 */
router.post('/:id/revoke', apiKeyController.revoke);

/**
 * @route   DELETE /api/v1/user/apikeys/:id
 * @desc    Delete an API key
 * @access  Protected
 */
router.delete('/:id', apiKeyController.delete);

export default router;
