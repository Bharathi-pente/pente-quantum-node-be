import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import logger from '../config/logger';

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

  // Log error
  logger.error(`[${req.method}] ${req.path} >> StatusCode: ${statusCode}, Message: ${message}`);

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
    }),
  });

  // If not operational, exit process
  if (!isOperational) {
    logger.error('Non-operational error detected. Shutting down...');
    process.exit(1);
  }
};

export const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route ${_req.originalUrl} not found`));
};
