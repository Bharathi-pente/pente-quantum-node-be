/**
 * Sentry Configuration for Backend
 * 
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import logger from './logger';

// Initialize Sentry
export const initializeSentry = () => {
  const sentryDsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (sentryDsn && environment === 'production') {
    Sentry.init({
      dsn: sentryDsn,
      environment,
      integrations: [
        nodeProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.1, // Capture 10% of transactions
      // Profiling
      profilesSampleRate: 0.1, // Profile 10% of transactions
    });

    logger.info('[Sentry] Initialized for production environment');
  } else {
    logger.info('[Sentry] Disabled for development environment');
  }
};

export default Sentry;
