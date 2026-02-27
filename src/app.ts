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
import { registerServices } from './config/serviceRegistration';

// Import routes
import routes from './routes';

// Import middleware
import { errorHandler, notFound } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import { performanceMonitor } from './middleware/performance.middleware';
import { diMiddleware } from './middleware/di.middleware';
import { dataLoaderMiddleware } from './middleware/dataLoader.middleware';

// Initialize Sentry
initializeSentry();

// Register services with DI container
registerServices();

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
// DEPENDENCY INJECTION
// ═══════════════════════════════════════════

app.use(diMiddleware);

// ═══════════════════════════════════════════
// DATALOADER (N+1 Query Prevention)
// ═══════════════════════════════════════════

app.use(dataLoaderMiddleware);

// ═══════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════

// Security middleware
app.use(helmet());

// CORS - Secure origin configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000']; // Default for development only

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id', 'x-customer-id'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400, // 24 hours
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
