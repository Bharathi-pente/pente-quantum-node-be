import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import logger from '../config/logger';
import { sanitizeLog } from '../utils/logSanitizer';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log error with sanitization
  logger.error(
    sanitizeLog(`[${req.method}] ${req.path} >> StatusCode: ${statusCode}, Message: ${message}`)
  );
  
  // Log stack trace for debugging (sanitized)
  if (process.env.NODE_ENV === 'development') {
    logger.error(sanitizeLog('Error stack:' + (err.stack || '')));
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
    }),
  });

  // Only exit process for truly critical non-operational errors
  // Don't exit for request-level errors (let nodemon restart on file changes instead)
  if (!isOperational && statusCode >= 500) {
    logger.error('Critical non-operational error detected.');
    // In production, you might want to exit here
    // In development, just log and continue
    if (process.env.NODE_ENV === 'production') {
      logger.error('Shutting down...');
      process.exit(1);
    } else {
      logger.warn('Development mode: Not exiting process. Fix the error and save to restart.');
    }
  }
};

export const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route ${_req.originalUrl} not found`));
};
