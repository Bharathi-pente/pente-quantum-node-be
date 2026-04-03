// src/middleware/keycloakAuth.middleware.ts
// Verifies Keycloak JWT tokens using JWKS (public key — no secrets needed)

import { Request, Response, NextFunction } from 'express';
import jwksRsa from 'jwks-rsa';
import jwt from 'jsonwebtoken';
import KC from '../config/keycloak.config';

// Initialize JWKS client — caches public keys for 10 minutes
const jwksClient = jwksRsa({
  jwksUri: KC.JWKS_URL,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

export interface AuthRequest extends Request {
  user?: {
    keycloakId: string;
    email: string;
    name: string | null;
    roles: string[];
    realmRoles: string[];
    tokenExpiry: number;
  };
}

/**
 * Keycloak JWT Authentication Middleware
 * Verifies JWT tokens issued by Keycloak using JWKS
 */
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Include Authorization: Bearer <token>',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // 2. Decode JWT header to get key ID (kid)
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header?.kid) {
      res.status(401).json({ success: false, message: 'Invalid token format' });
      return;
    }

    // 3. Fetch the matching public key from Keycloak JWKS endpoint
    const signingKey = await jwksClient.getSigningKey(decoded.header.kid);
    const publicKey = signingKey.getPublicKey();

    // 4. Verify token signature, issuer, and expiry
    const verified = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: `${KC.BASE_URL}/realms/${KC.REALM}`,
    }) as any;

    // 5. Extract client roles from token
    // Keycloak puts client roles here: resource_access['quantum-billing-client'].roles
    const clientRoles = verified.resource_access?.[KC.CLIENT_ID]?.roles || [];
    const realmRoles = verified.realm_access?.roles || [];

    // 6. Attach user info to req.user — available in all downstream routes
    req.user = {
      keycloakId: verified.sub, // Keycloak UUID — use to look up your DB users table
      email: verified.email,
      name: verified.name || null,
      roles: clientRoles, // ['billing-admin'] or ['billing-manager'] etc.
      realmRoles: realmRoles,
      tokenExpiry: verified.exp,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Token expired. Please refresh.' });
      return;
    }
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }
    res.status(401).json({ success: false, message: 'Authentication failed', error: err.message });
  }
};

export default authMiddleware;
