import { Request } from 'express';

export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  orgId?: string;
  organization?: string;
  tokenPayload?: any;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  orgId?: string;
}

export default {} as any;
