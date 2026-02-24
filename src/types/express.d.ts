/**
 * Express Request Type Extension
 * 
 * Extends the Express Request interface to include Keycloak user information
 */

import { KeycloakUser } from '../middleware/keycloakAuth.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: KeycloakUser;
    }
  }
}

export {};
