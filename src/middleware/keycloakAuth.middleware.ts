/**
 * Keycloak Authentication Middleware
 * 
 * Validates JWT tokens issued by Keycloak using JWKS (JSON Web Key Set).
 * Provides stateless authentication without sessions.
 * 
 * Features:
 * - JWT verification using Keycloak public keys
 * - Automatic JWKS caching and rotation
 * - Role-based access control (RBAC)
 * - Organization ID extraction from token
 * - TypeScript strict mode compatible
 * 
 * Organization ID Configuration:
 * To include organization_id in Keycloak tokens, configure a User Attribute Mapper:
 * 
 * 1. In Keycloak Admin Console, go to your client (e.g., quantum-frontend)
 * 2. Click on "Client scopes" tab
 * 3. Click on the client scope (or add a new one)
 * 4. Go to "Mappers" tab
 * 5. Click "Add mapper" → "By configuration" → "User Attribute"
 * 6. Configure:
 *    - Name: organization-id-mapper
 *    - User Attribute: organization_id
 *    - Token Claim Name: organization_id
 *    - Claim JSON Type: String
 *    - Add to ID token: ON
 *    - Add to access token: ON
 *    - Add to userinfo: ON
 * 7. Save
 * 
 * Then assign organization_id attribute to users in "Users" → [User] → "Attributes" tab
 * 
 * Alternatively, set DEFAULT_ORG_ID environment variable as a fallback.
 */

import { Request, Response, NextFunction } from 'express';
import { jwtVerify, JWTPayload, createLocalJWKSet } from 'jose';
import ApiError from '../utils/ApiError';

// Environment variables
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'quantum-billing';

// Construct JWKS URL
const JWKS_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;

// Log configuration on startup
console.log('[Keycloak Auth] Configuration:');
console.log('  - URL:', KEYCLOAK_URL);
console.log('  - Realm:', KEYCLOAK_REALM);
console.log('  - JWKS URL:', JWKS_URL);
console.log('  - Expected Issuer:', `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`);
console.log('  - Default Org ID:', process.env.DEFAULT_ORG_ID || 'default-org-id');

// Fetch and filter JWKS to only include signing keys
let jwksCache: any = null;
let jwksCacheTime = 0;
const JWKS_CACHE_DURATION = 600000; // 10 minutes

async function getFilteredJWKS() {
  const now = Date.now();
  
  // Return cached JWKS if still valid
  if (jwksCache && (now - jwksCacheTime) < JWKS_CACHE_DURATION) {
    console.log('[Keycloak Auth] Using cached JWKS');
    return jwksCache;
  }

  try {
    console.log('[Keycloak Auth] Fetching JWKS from:', JWKS_URL);
    const response = await fetch(JWKS_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`);
    }
    
    const jwks = await response.json() as { keys: any[] };
    
    console.log('[Keycloak Auth] Total keys in JWKS:', jwks.keys?.length);
    console.log('[Keycloak Auth] Raw keys:', JSON.stringify(jwks.keys.map((k: any) => ({
      kid: k.kid,
      kty: k.kty,
      alg: k.alg,
      use: k.use
    })), null, 2));
    
    // Filter only signing keys - be very explicit
    const signingKeys = jwks.keys.filter((key: any) => {
      // Must have RSA or EC key type
      if (!key.kty || (key.kty !== 'RSA' && key.kty !== 'EC' && key.kty !== 'OKP')) {
        console.log(`[Keycloak Auth] Excluding key ${key.kid}: unsupported kty ${key.kty}`);
        return false;
      }
      
      // If 'use' is specified, it must be 'sig'
      if (key.use && key.use !== 'sig') {
        console.log(`[Keycloak Auth] Excluding key ${key.kid}: use=${key.use}`);
        return false;
      }
      
      // If 'alg' is specified, check it's a signing algorithm
      if (key.alg) {
        // Explicitly allow only signing algorithms
        const signingAlgs = [
          'RS256', 'RS384', 'RS512',  // RSA with SHA
          'PS256', 'PS384', 'PS512',  // RSA-PSS
          'ES256', 'ES384', 'ES512',  // ECDSA
          'EdDSA', 'ES256K'            // EdDSA and secp256k1
        ];
        
        if (!signingAlgs.includes(key.alg)) {
          console.log(`[Keycloak Auth] Excluding key ${key.kid}: unsupported alg ${key.alg}`);
          return false;
        }
      }
      
      console.log(`[Keycloak Auth] Including key ${key.kid}: ${key.alg || 'no alg'}, use: ${key.use || 'not specified'}`);
      return true;
    });
    
    console.log('[Keycloak Auth] Filtered signing keys:', signingKeys.length);
    
    if (signingKeys.length === 0) {
      throw new Error('No signing keys found in JWKS after filtering');
    }
    
    // Create filtered JWKS
    const filteredJWKS = {
      keys: signingKeys
    };
    
    // Cache the filtered JWKS
    jwksCache = createLocalJWKSet(filteredJWKS);
    jwksCacheTime = now;
    
    console.log('[Keycloak Auth] Successfully created and cached JWKS');
    return jwksCache;
  } catch (error) {
    console.error('[Keycloak Auth] Error fetching/filtering JWKS:', error);
    throw error;
  }
}

/**
 * Keycloak token payload interface
 */
interface KeycloakTokenPayload extends JWTPayload {
  sub: string; // Subject (user ID in Keycloak)
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
}

/**
 * User information attached to request
 */
export interface KeycloakUser {
  id: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  orgId: string;
  organization?: string;
  tokenPayload: KeycloakTokenPayload;
}

/**
 * Extended Express Request with user
 */
export interface AuthRequest extends Request {
  user?: KeycloakUser;
}

/**
 * Middleware to authenticate requests using Keycloak JWT
 */
export const authenticateKeycloak = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Development bypass: allow unauthenticated requests if BYPASS_AUTH is set
    if (process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development') {
      console.log('[Keycloak Auth] ⚠️  DEVELOPMENT MODE: Bypassing authentication');
      
      // Create a mock user for development
      req.user = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        username: 'dev-user',
        firstName: 'Dev',
        lastName: 'User',
        roles: ['admin', 'user'], // Give all roles in dev mode
        orgId: process.env.DEFAULT_ORG_ID || 'dev-org-id',
        organization: 'Development Org',
        tokenPayload: {} as any,
      };

      // Allow organization override in development mode
      const overrideOrgId = req.headers['x-organization-id'] as string;
      if (overrideOrgId) {
        req.user.orgId = overrideOrgId;
        console.log(`[Keycloak Auth] Dev mode overriding orgId to: ${overrideOrgId}`);
      }
      
      return next();
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Decode token header to see the algorithm (for debugging)
    try {
      const [headerB64] = token.split('.');
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
      console.log('[Keycloak Auth] Token algorithm:', header.alg);
    } catch (e) {
      console.log('[Keycloak Auth] Could not decode token header for debugging');
    }

    // Get filtered JWKS (only signing keys)
    const jwks = await getFilteredJWKS();

    // Verify token using filtered JWKS
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
    });

    const keycloakPayload = payload as KeycloakTokenPayload;

    // Extract roles from realm_access
    const roles = keycloakPayload.realm_access?.roles || [];

    // Extract organization info from token (if available) or use a default
    // In production, this should come from the Keycloak token custom claims
    let orgId = (keycloakPayload.organization_id as string) || 
                (keycloakPayload.org_id as string) ||
                process.env.DEFAULT_ORG_ID || 
                'default-org-id';

    // Attach user to request
    req.user = {
      id: keycloakPayload.sub,
      email: keycloakPayload.email,
      username: keycloakPayload.preferred_username,
      firstName: keycloakPayload.given_name,
      lastName: keycloakPayload.family_name,
      roles,
      orgId,
      organization: (keycloakPayload.organization as string) || undefined,
      tokenPayload: keycloakPayload,
    };

    // Allow admin users to override organization via header
    if (roles.includes('admin') || roles.includes('QuantumBill Admin')) {
      const overrideOrgId = req.headers['x-organization-id'] as string;
      if (overrideOrgId) {
        req.user.orgId = overrideOrgId;
        console.log(`[Keycloak Auth] Admin user overriding orgId to: ${overrideOrgId}`);
      }
    }

    next();
  } catch (error: any) {
    console.error('Keycloak authentication error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      name: error.name,
    });
    
    if (error.code === 'ERR_JWT_EXPIRED') {
      next(ApiError.unauthorized('Token expired'));
    } else if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      next(ApiError.unauthorized('Invalid token signature'));
    } else if (error.code === 'ERR_JWKS_NO_MATCHING_KEY') {
      next(ApiError.unauthorized('No matching key found in JWKS'));
    } else if (error.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
      next(ApiError.unauthorized(`Token claim validation failed: ${error.message}`));
    } else if (error.message?.includes('issuer')) {
      next(ApiError.unauthorized('Token issuer mismatch - check KEYCLOAK_URL and KEYCLOAK_REALM'));
    } else {
      next(ApiError.unauthorized(`Invalid token: ${error.message || 'Unknown error'}`));
    }
  }
};

/**
 * Middleware to require specific realm role(s)
 * 
 * @param roles - One or more role names required to access the route
 * @returns Express middleware function
 * 
 * @example
 * router.get('/admin', requireRole('admin'), adminController);
 * router.post('/users', requireRole('admin', 'user-manager'), createUser);
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('User not authenticated'));
      return;
    }

    const userRoles = req.user.roles;
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      next(
        ApiError.forbidden(
          `Access denied. Required role(s): ${roles.join(', ')}`
        )
      );
      return;
    }

    next();
  };
};

/**
 * Middleware to require specific client role(s)
 * 
 * @param clientId - The client ID to check roles for
 * @param roles - One or more role names required
 * @returns Express middleware function
 * 
 * @example
 * router.get('/api', requireClientRole('quantum-backend', 'api-user'), handler);
 */
export const requireClientRole = (clientId: string, ...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('User not authenticated'));
      return;
    }

    const clientRoles = req.user.tokenPayload.resource_access?.[clientId]?.roles || [];
    const hasRequiredRole = roles.some(role => clientRoles.includes(role));

    if (!hasRequiredRole) {
      next(
        ApiError.forbidden(
          `Access denied. Required ${clientId} role(s): ${roles.join(', ')}`
        )
      );
      return;
    }

    next();
  };
};

/**
 * Optional authentication - does not fail if no token present
 * Useful for routes that work both with and without authentication
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without user
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    
    // Get filtered JWKS (only signing keys)
    const jwks = await getFilteredJWKS();
    
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
    });

    const keycloakPayload = payload as KeycloakTokenPayload;
    const roles = keycloakPayload.realm_access?.roles || [];

    const orgId = (keycloakPayload.organization_id as string) || 
                  (keycloakPayload.org_id as string) ||
                  process.env.DEFAULT_ORG_ID || 
                  'default-org-id';

    req.user = {
      id: keycloakPayload.sub,
      email: keycloakPayload.email,
      username: keycloakPayload.preferred_username,
      firstName: keycloakPayload.given_name,
      lastName: keycloakPayload.family_name,
      roles,
      orgId,
      organization: (keycloakPayload.organization as string) || undefined,
      tokenPayload: keycloakPayload,
    };
  } catch (error) {
    // Invalid token, but don't fail - just continue without user
    console.warn('Optional auth: Invalid token provided');
  }

  next();
};
