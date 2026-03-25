/**
 * Organization Context Middleware
 * 
 * Ensures that all requests have a valid organization context.
 * This middleware should be applied to routes that require organization-scoped data access.
 * 
 * It validates that:
 * 1. The request has an authenticated user with an orgId
 * 2. The orgId is attached to the request for consistent use in controllers
 * 
 * This prevents cross-organization data leakage and ensures consistent access control.
 */

import { Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import type { AuthRequest } from './keycloakAuth.middleware';

/**
 * Middleware that requires organization context from authenticated user
 * 
 * @throws ApiError.unauthorized if no organization context is found
 */
export const requireOrgContext = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const orgId = req.user?.orgId;

  if (!orgId) {
    throw ApiError.unauthorized(
      'Organization context required. Please ensure you are authenticated and assigned to an organization.'
    );
  }

  // Attach orgId to request for easy access in controllers
  req.orgId = orgId;
  
  next();
};

/**
 * Middleware that optionally extracts organization context
 * Does not throw an error if missing, but attaches if available
 * 
 * Use this for routes that may work with or without organization context
 */
export const extractOrgContext = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const orgId = req.user?.orgId;

  if (orgId) {
    req.orgId = orgId;
  }

  next();
};
