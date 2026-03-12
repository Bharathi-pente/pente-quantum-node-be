import { Router } from 'express';
import externalEventsController from '../controllers/externalEvents.controller';
import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';

const router = Router();

/**
 * All routes require Keycloak authentication
 */
router.use(authenticateKeycloak);

/**
 * @route   GET /api/v1/user/events/health
 * @desc    Check external events service health
 * @access  Private (Keycloak)
 */
router.get('/health', externalEventsController.getServiceHealth);

/**
 * @route   GET /api/v1/user/events/:userId
 * @desc    Get user events metrics from external service
 * @access  Private (Keycloak)
 * @query   limit - Number of events (default: 100, max: 1000)
 * @query   offset - Offset for pagination (default: 0)
 */
router.get('/:userId', externalEventsController.getUserEvents);

// Raw events list (count + events[])
router.get('/:userId/list', externalEventsController.getUserEventsList);

// Token usage summary derived from events
router.get('/token-usage/:userId', externalEventsController.getUserTokenUsage);

export default router;
