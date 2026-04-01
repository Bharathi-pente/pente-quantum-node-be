// src/middleware/keycloakRole.middleware.ts
// Role and permission guards — use AFTER authMiddleware

import { Response, NextFunction } from 'express';
import { AuthRequest } from './keycloakAuth.middleware';

// ─────────────────────────────────────────────────────────────
// ROLE GUARD: Check if user has one of the required Keycloak roles
// Usage: requireRole('billing-admin')
// Usage: requireRole('billing-admin', 'billing-manager')
// ─────────────────────────────────────────────────────────────
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        yourRoles: userRoles,
      });
      return;
    }

    next();
  };
}

// ─────────────────────────────────────────────────────────────
// PERMISSION GUARD: Check if user has a specific DB permission
// Requires req.user.permissions to be populated (load from DB in authMiddleware or a separate step)
// Usage: requirePermission('invoices.write')
// ─────────────────────────────────────────────────────────────
export function requirePermission(permission: string) {
  return (req: any, res: Response, next: NextFunction): void => {
    const userPermissions = req.user?.permissions || [];

    if (!userPermissions.includes(permission)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`,
      });
      return;
    }

    next();
  };
}

// Role hierarchy constants for reference
export const ROLES = {
  ADMIN: 'billing-admin',
  MANAGER: 'billing-manager',
  VIEWER: 'billing-viewer',
};
