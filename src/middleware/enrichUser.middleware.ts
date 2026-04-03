// src/middleware/enrichUser.middleware.ts
// Enriches req.user with database user information after Keycloak authentication
// Use this AFTER keycloakAuth.middleware to load full user details from DB

import { Response, NextFunction } from 'express';
import { AuthRequest as KeycloakAuthRequest } from './keycloakAuth.middleware';
import prisma from '../config/database';

// In-memory cache for user data to reduce DB queries
interface CachedUser {
  id: string;
  orgId: string | null;
  organization: string | null;
  dbRoles: string[];
  cachedAt: number;
}

const userCache = new Map<string, CachedUser>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clear expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.cachedAt > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

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

    // Check cache first
    const cached = userCache.get(req.user.keycloakId);
    if (cached && (Date.now() - cached.cachedAt) < CACHE_TTL) {
      // Use cached data
      req.user.id = cached.id;
      req.user.orgId = cached.orgId;
      req.user.organization = cached.organization;
      req.user.dbRoles = cached.dbRoles;
      next();
      return;
    }

    // Fetch from database if not in cache or expired
    const dbUser = await prisma.$transaction(async (tx) => {
      return await tx.users.findUnique({
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
    });

    if (dbUser) {
      // Enrich req.user with database info
      req.user.id = dbUser.id;
      req.user.orgId = dbUser.org_id;
      req.user.organization = dbUser.organizations?.name || null;
      req.user.dbRoles = dbUser.roles ? [dbUser.roles.name] : [];

      // Cache the user data
      userCache.set(req.user.keycloakId, {
        id: dbUser.id,
        orgId: dbUser.org_id,
        organization: dbUser.organizations?.name || null,
        dbRoles: dbUser.roles ? [dbUser.roles.name] : [],
        cachedAt: Date.now(),
      });
    }

    next();
  } catch (error: any) {
    console.error('Error enriching user:', error);
    // Don't fail the request, just proceed without enrichment
    next();
  }
}

export default enrichUserMiddleware;
