/**
 * DataLoader Middleware
 * 
 * Attach DataLoader instances to each request
 */

import { Request, Response, NextFunction } from 'express';
import { createDataLoaders, DataLoaders } from '../utils/dataLoader';

declare global {
  namespace Express {
    interface Request {
      loaders: DataLoaders;
    }
  }
}

/**
 * Middleware to create DataLoader instances for each request
 * This ensures:
 * 1. Batch loading of related data
 * 2. Per-request caching to avoid duplicate queries
 * 3. Prevention of N+1 query problems
 */
export const dataLoaderMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Create fresh loaders for this request
  req.loaders = createDataLoaders();

  next();
};
