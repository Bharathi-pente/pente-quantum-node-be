// src/middleware/enrichUser.middleware.ts
// Enriches req.user with database user information after Keycloak authentication
// Use this AFTER keycloakAuth.middleware to load full user details from DB

import { Response, NextFunction } from 'express';
import { AuthRequest as KeycloakAuthRequest } from './keycloakAuth.middleware';
import prisma from '../config/database';

// Extended auth request with DB user info
export interface EnrichedAuthRequest extends KeycloakAuthRequest {
  user?: {
    // From Keycloak
    keycloakId: string;
    email: string;
    name: string | null;
    roles: string[];
    realmRoles: string[];
    tokenExpiry: number;
    // From Database
    id?: string;
    orgId?: string | null;
    organization?: string | null;
    dbRoles?: string[];
  };
}

/**
 * Middleware to enrich req.user with database information
 * Loads user from DB using keycloakId and adds id, orgId, organization name
 */
async function enrichUserMiddleware(
  req: EnrichedAuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.keycloakId) {
      // No authenticated user, skip enrichment
      next();
      return;
    }

    // Find user in database by keycloak_user_id
    const dbUser = await prisma.users.findUnique({
      where: { keycloak_user_id: req.user.keycloakId },
      select: {
        id: true,
        org_id: true,
        organizations: {
          select: {
            name: true,
          },
        },
        roles: {
          select: {
            name: true,
          },
        },
      },
    });

    if (dbUser) {
      // Enrich req.user with database info
      req.user.id = dbUser.id;
      req.user.orgId = dbUser.org_id;
      req.user.organization = dbUser.organizations?.name || null;
      req.user.dbRoles = dbUser.roles ? [dbUser.roles.name] : [];
    }

    next();
  } catch (error: any) {
    console.error('Error enriching user:', error);
    // Don't fail the request, just proceed without enrichment
    next();
  }
}

export default enrichUserMiddleware;
