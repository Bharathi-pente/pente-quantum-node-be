// src/routes/keycloakAuth.routes.ts

import { Router } from 'express';
import authMiddleware from '../middleware/keycloakAuth.middleware';
import { requireRole, ROLES } from '../middleware/keycloakRole.middleware';
import * as authController from '../controllers/keycloakAuth.controller';

const router = Router();

// ── PUBLIC ROUTES (no token required) ────────────────────────
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// ── PROTECTED ROUTES (token required) ────────────────────────

// Get current user profile
router.get('/me', authMiddleware, authController.getMe);

// ── ROLE-PROTECTED ROUTE EXAMPLES ────────────────────────────

// Only billing-admin can access
router.get(
  '/admin/users',
  authMiddleware,
  requireRole(ROLES.ADMIN),
  (_req, res) => res.json({ success: true, message: 'Admin user list — connect your DB here' })
);

// billing-admin and billing-manager can access
router.get(
  '/dashboard',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  (_req, res) => res.json({ success: true, message: 'Dashboard data — connect your DB here' })
);

// All authenticated users can access (all 3 roles)
router.get(
  '/reports',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.VIEWER),
  (_req, res) => res.json({ success: true, message: 'Reports — connect your DB here' })
);

export default router;
