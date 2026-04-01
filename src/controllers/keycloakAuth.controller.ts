// src/controllers/keycloakAuth.controller.ts

import { Response } from 'express';
import jwt from 'jsonwebtoken';
import kcService from '../services/keycloak.service';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';

// ─────────────────────────────────────────────────────────────
// POST /auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────
export async function login(req: AuthRequest, res: Response): Promise<void> {
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

    // 3. TODO: Load user from your PostgreSQL users table using keycloakUserId
    // const dbUser = await db.query(
    //   'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.keycloak_user_id = $1',
    //   [keycloakUserId]
    // );

    // 4. TODO: Load permissions from role_permissions table
    // const permissions = await db.query(
    //   'SELECT rp.permission FROM role_permissions rp JOIN users u ON u.role_id = rp.role_id WHERE u.keycloak_user_id = $1',
    //   [keycloakUserId]
    // );

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
          email: decoded.email,
          name: decoded.name || null,
          roles: clientRoles,
          // permissions: permissions.rows.map(p => p.permission), // uncomment after DB integration
        },
      },
    });
  } catch (err: any) {
    res.status(401).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /auth/register
// Body: { email, password, role, orgId }
// role must be: 'billing-admin' | 'billing-manager' | 'billing-viewer'
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

    const validRoles = ['billing-admin', 'billing-manager', 'billing-viewer'];
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

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        keycloakUserId,
        email,
        role,
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
