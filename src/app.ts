import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configurations
import logger from './config/logger';
import { swaggerSpec } from './config/swagger';
import { initializeSentry } from './config/sentry';
import { setupExpressErrorHandler } from '@sentry/node';

// Import routes
import routes from './routes';

// Import middleware
import { errorHandler, notFound } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import { performanceMonitor } from './middleware/performance.middleware';

// Initialize Sentry
initializeSentry();

// Create Express app
const app: Application = express();

// ═══════════════════════════════════════════
// SENTRY REQUEST HANDLER (must be first)
// ═══════════════════════════════════════════

if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
  // Sentry automatically instruments Express with setupExpressErrorHandler
}

// ═══════════════════════════════════════════
// PERFORMANCE MONITORING
// ═══════════════════════════════════════════

app.use(performanceMonitor);

// ═══════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  }));
}

// Rate limiting
app.use('/api', apiLimiter);

// ═══════════════════════════════════════════
// API DOCUMENTATION
// ═══════════════════════════════════════════

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'QuantumBilling API Docs',
}));

// Swagger JSON
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ═══════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'QuantumBilling API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/v1/health',
  });
});

// API routes
app.use('/api/v1', routes);

// ═══════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════

// 404 handler
app.use(notFound);

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
  setupExpressErrorHandler(app);
}

// Global error handler
app.use(errorHandler);

export default app;
