import { Request, Response, NextFunction } from 'express';
import { container } from '../core/DIContainer';

declare module 'express' {
  interface Request {
    container: typeof container;
  }
}

/**
 * Middleware to create a scoped container for each request
 */
export const diMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Create a scoped container for this request
  req.container = container.createScope();

  // Clean up scoped instances after the response is sent
  res.on('finish', () => {
    req.container.clearScope();
  });

  next();
};
