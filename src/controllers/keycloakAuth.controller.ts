// src/controllers/keycloakAuth.controller.ts

import { Response } from 'express';
import jwt from 'jsonwebtoken';
import kcService from '../services/keycloak.service';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import logger from '../config/logger';
import prisma from '../config/database';

// ─────────────────────────────────────────────────────────────
// POST /auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────
export async function login(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    // 1. Authenticate with Keycloak → get tokens
    const tokens = await kcService.loginUser(email, password);

    // 2. Decode access token to extract user info (no verify needed — Keycloak just issued it)
    const decoded: any = jwt.decode(tokens.access_token);

    const keycloakUserId = decoded.sub;
    const clientRoles =
      decoded.resource_access?.[process.env.KEYCLOAK_QUANTUM_CLIENT_ID!]?.roles || [];

    // 3. Look up user in database by email
    let dbUser = await prisma.users.findFirst({
      where: {
        email: email
      },
      include: {
        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          }
        },
        roles: {
          select: {
            id: true,
            name: true,
          }
        },
        // created_organizations: { // Temporarily commented out due to missing created_by column
        //   select: {
        //     id: true,
        //     name: true,
        //     slug: true,
        //     status: true,
        //   }
        // }
      }
    });

    // 4. If user doesn't exist in DB, create or handle based on role
    if (!dbUser) {
      // Check if user is super admin (billing-admin)
      const isSuperAdmin = clientRoles.includes('billing-admin');
      
      if (isSuperAdmin) {
        // Auto-create super admin user (no org required)
        dbUser = await prisma.users.create({
          data: {
            keycloak_user_id: keycloakUserId,
            email: decoded.email,
            name: decoded.name || decoded.email,
            status: 'active',
            keycloak_roles: clientRoles,
            org_id: null, // Super admin has no specific org initially
            avatar_initials: getInitials(decoded.name || decoded.email),
          },
          include: {
            organizations: true,
            roles: true,
            // created_organizations: true, // Temporarily commented out
          }
        });
      } else {
        // Non-admin users must be invited first
        return res.status(403).json({
          success: false,
          message: 'User not found. Please contact your organization administrator to invite you.',
          code: 'USER_NOT_INVITED'
        });
      }
    }

    // 5. Update keycloak_user_id if not set (for existing users)
    if (!dbUser.keycloak_user_id) {
      await prisma.users.update({
        where: { id: dbUser.id },
        data: {
          keycloak_user_id: keycloakUserId,
          keycloak_roles: clientRoles,
          last_active_at: new Date(),
        }
      });
    } else {
      // Just update last active and roles cache
      await prisma.users.update({
        where: { id: dbUser.id },
        data: {
          keycloak_roles: clientRoles,
          last_active_at: new Date(),
        }
      });
    }

    // 6. Check user and org status
    const isSuperAdmin = clientRoles.includes('billing-admin');
    
    if (dbUser.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${dbUser.status}. Please contact your administrator.`,
        code: 'USER_NOT_ACTIVE'
      });
    }

    // For super admins, check if they have any active organizations they created
    if (isSuperAdmin) {
      // const hasActiveOrgs = dbUser.created_organizations.some(org => org.status === 'active');
      // if (!hasActiveOrgs && dbUser.created_organizations.length > 0) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'All your organizations are inactive. Please contact support.',
      //     code: 'ALL_ORGS_INACTIVE'
      //   });
      // }
    } else {
      // For regular users, check their assigned organization
      if (dbUser.organizations && dbUser.organizations.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: `Your organization is ${dbUser.organizations.status}. Please contact support.`,
          code: 'ORG_NOT_ACTIVE'
        });
      }
    }

    // 7. Prepare accessible organizations based on user type
    let accessibleOrganizations = [];
    let primaryOrgId = null;
    let primaryOrganization = null;

    if (isSuperAdmin) {
      // Super admins can access all organizations (temporary - will be restricted to created ones later)
      // accessibleOrganizations = dbUser.created_organizations.filter(org => org.status === 'active');
      accessibleOrganizations = []; // Temporarily empty until database is updated
      
      // If they have an assigned org_id, use that as primary
      if (dbUser.org_id) {
        // Try to find the primary org (this won't work without the relationship)
        primaryOrgId = dbUser.org_id;
        primaryOrganization = dbUser.organizations;
      }
      
      // If no primary org set, use the first one (none for now)
      if (!primaryOrgId && accessibleOrganizations.length > 0) {
        primaryOrgId = accessibleOrganizations[0].id;
        primaryOrganization = accessibleOrganizations[0];
      }
    } else {
      // Regular users can only access their assigned organization
      if (dbUser.organizations && dbUser.organizations.status === 'active') {
        accessibleOrganizations = [dbUser.organizations];
        primaryOrgId = dbUser.org_id;
        primaryOrganization = dbUser.organizations;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        token_type: tokens.token_type,
        user: {
          keycloakId: keycloakUserId,
          userId: dbUser.id,
          email: decoded.email,
          name: dbUser.name,
          roles: clientRoles,
          orgId: primaryOrgId, // Primary organization for backward compatibility
          organization: primaryOrganization, // Primary organization details
          accessibleOrganizations: accessibleOrganizations, // All organizations user can access
        },
      },
    });
  } catch (err: any) {
    logger.error('Login error:', err);
    res.status(401).json({ success: false, message: err.message });
  }
}

// Helper function to generate initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// ─────────────────────────────────────────────────────────────
// POST /auth/register
// Body: { email, password, role, orgId }
// role must be: 'billing-admin' | 'billing-manager' | 'billing-org-admin' | 'billing-viewer'
// ─────────────────────────────────────────────────────────────
export async function register(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password, role = 'billing-viewer' } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    // TODO: Extract orgId when integrating with database
    // const { orgId } = req.body;

    const validRoles = ['billing-admin', 'billing-manager', 'billing-org-admin', 'billing-viewer'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
      return;
    }

    // 1. Create user in Keycloak + assign role → returns Keycloak UUID
    const keycloakUserId = await kcService.createKeycloakUser(email, password, role);

    // 2. TODO: Insert user into your PostgreSQL users table
    // const newUser = await db.query(
    //   `INSERT INTO users (id, org_id, email, keycloak_user_id, role_id, status, created_at)
    //    VALUES (gen_random_uuid(), $1, $2, $3,
    //      (SELECT id FROM roles WHERE name = $4 AND org_id = $1),
    //      'active', NOW())
    //    RETURNING *`,
    //   [orgId, email, keycloakUserId, role]
    // );

    // 3. Auto-login the newly registered user
    const tokens = await kcService.loginUser(email, password);
    const decoded: any = jwt.decode(tokens.access_token);
    const clientRoles =
      decoded.resource_access?.[process.env.KEYCLOAK_QUANTUM_CLIENT_ID!]?.roles || [];

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        token_type: tokens.token_type,
        user: {
          keycloakId: keycloakUserId,
          email: decoded.email,
          name: decoded.name || null,
          roles: clientRoles,
        },
      },
    });
  } catch (err: any) {
    // Handle Keycloak duplicate user error
    if (err.response?.status === 409) {
      res.status(409).json({ success: false, message: 'User with this email already exists' });
      return;
    }
    res.status(400).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /auth/refresh
// Body: { refresh_token }
// ─────────────────────────────────────────────────────────────
export async function refresh(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({ success: false, message: 'refresh_token is required' });
      return;
    }

    const tokens = await kcService.refreshToken(refresh_token);

    res.status(200).json({
      success: true,
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
    });
  } catch (err: any) {
    res.status(401).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /auth/logout
// Body: { refresh_token }
// ─────────────────────────────────────────────────────────────
export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({ success: false, message: 'refresh_token is required' });
      return;
    }

    await kcService.logoutUser(refresh_token);

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /auth/me  (Protected)
// Returns the currently authenticated user info from the token
// ─────────────────────────────────────────────────────────────
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    // req.user is attached by authMiddleware
    // TODO: Optionally load full user profile from PostgreSQL
    // const dbUser = await db.query('SELECT * FROM users WHERE keycloak_user_id = $1', [req.user.keycloakId]);

    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
