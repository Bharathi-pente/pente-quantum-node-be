import { Router } from 'express';
import webhookController from '../controllers/webhook.controller';
import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createWebhookSchema,
  updateWebhookSchema,
  getWebhookSchema,
} from '../validators/webhook.validator';

const router = Router();

// All webhook routes require authentication
router.use(authenticateKeycloak);

/**
 * @route   POST /api/v1/webhooks
 * @desc    Create webhook
 * @access  Private
 */
router.post(
  '/',
  validate(createWebhookSchema),
  webhookController.webhookController.create
);

/**
 * @route   GET /api/v1/webhooks
 * @desc    Get all webhooks
 * @access  Private
 */
router.get('/', webhookController.webhookController.getAll);

/**
 * @route   GET /api/v1/webhooks/events
 * @desc    Get available webhook events
 * @access  Private
 */
router.get('/events', webhookController.webhookEventController.getAvailableEvents);

/**
 * @route   GET /api/v1/webhooks/stats
 * @desc    Get webhook statistics
 * @access  Private
 */
router.get('/stats', webhookController.webhookLogController.getStats);

/**
 * @route   GET /api/v1/webhooks/logs
 * @desc    Get webhook logs
 * @access  Private
 */
router.get('/logs', webhookController.webhookLogController.getAll);

/**
 * @route   GET /api/v1/webhooks/:id
 * @desc    Get webhook by ID
 * @access  Private
 */
router.get('/:id', validate(getWebhookSchema), webhookController.webhookController.getById);

/**
 * @route   PUT /api/v1/webhooks/:id
 * @desc    Update webhook
 * @access  Private
 */
router.put(
  '/:id',
  validate(updateWebhookSchema),
  webhookController.webhookController.update
);

export default router;