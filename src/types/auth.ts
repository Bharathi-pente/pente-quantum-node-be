import { Request } from 'express';

export interface AuthUser {
  // From Keycloak
  keycloakId: string;
  email: string;
  name?: string | null;
  roles?: string[];
  realmRoles?: string[];
  tokenExpiry?: number;
  // From Database (added by enrichUserMiddleware)
  id?: string;
  orgId?: string | null;
  organization?: string | null;
  dbRoles?: string[];
  // Legacy fields (for backward compatibility)
  username?: string;
  firstName?: string;
  lastName?: string;
  tokenPayload?: any;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  orgId?: string;
}

export default {} as any;
