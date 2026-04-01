# GitHub Copilot Prompt — Keycloak Auth Implementation (Node + Express)

---

> **How to use this:**
> Open your backend project folder in VS Code → Open GitHub Copilot Chat → paste this entire prompt.

---

## PROMPT START

---

I need you to implement a complete **Keycloak authentication system** in my **Node.js + Express** backend. Read every instruction carefully and implement everything exactly as described. Do not skip any step.

---

## 1. CONTEXT & OVERVIEW

This is a **Quantum Billing** SaaS backend. We use **Keycloak** as our Identity Provider (IAM). Keycloak handles passwords, tokens, and roles. Our PostgreSQL database handles all business data. They are linked by a `keycloak_user_id` field on the `users` table.

**Keycloak is already set up with:**
- Realm: `quantum-billing`
- Client: `quantum-billing-client` (Direct Access Grants enabled, Client Authentication ON)
- 3 Client Roles: `billing-admin`, `billing-manager`, `billing-viewer`

**Auth flow:**
1. User sends email + password to our Express API
2. Our API calls Keycloak's token endpoint using Direct Access Grants
3. Keycloak returns `access_token` + `refresh_token`
4. Our API returns tokens to frontend
5. Every subsequent request from frontend sends `Authorization: Bearer <access_token>`
6. Our middleware verifies the token using Keycloak's JWKS endpoint (no hardcoded secrets)
7. Role and permission guards protect routes

---

## 2. ENVIRONMENT VARIABLES

These are already in the `.env` file. Use `process.env` to access them. Do NOT hardcode any values.

```env
KEYCLOAK_BASE_URL=https://keycloak.v2.dev.pentesitesai.com
KEYCLOAK_REALM=quantum-billing
KEYCLOAK_QUANTUM_CLIENT_ID=quantum-billing-client
KEYCLOAK_QUANTUM_CLIENT_SECRET=aFSg7Zs1Nd4pUe2To95aEdSiPlj0qpMs
KEYCLOAK_ADMIN_USERNAME=admin@pentesitesai.com
KEYCLOAK_ADMIN_PASSWORD=Admin@123
```

---

## 3. PACKAGES TO INSTALL

Run this first:

```bash
npm install axios jwks-rsa jsonwebtoken dotenv
```

---

## 4. FOLDER STRUCTURE TO CREATE

Create exactly this structure inside the project:

```
src/
├── config/
│   └── keycloak.config.js
├── middlewares/
│   ├── auth.middleware.js
│   └── role.middleware.js
├── services/
│   └── keycloak.service.js
├── controllers/
│   └── auth.controller.js
└── routes/
    └── auth.routes.js
```

---

## 5. FILE: `src/config/keycloak.config.js`

Create this file with the following content:

```js
// src/config/keycloak.config.js
// Central Keycloak configuration — all values come from .env

const KC = {
  BASE_URL: process.env.KEYCLOAK_BASE_URL,
  REALM: process.env.KEYCLOAK_REALM,
  CLIENT_ID: process.env.KEYCLOAK_QUANTUM_CLIENT_ID,
  CLIENT_SECRET: process.env.KEYCLOAK_QUANTUM_CLIENT_SECRET,
  ADMIN_USERNAME: process.env.KEYCLOAK_ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.KEYCLOAK_ADMIN_PASSWORD,

  // Keycloak OpenID token endpoint (used for login, refresh, logout)
  TOKEN_URL: `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,

  // JWKS endpoint — used by middleware to verify JWT signatures
  JWKS_URL: `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,

  // Logout endpoint
  LOGOUT_URL: `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`,

  // Keycloak Admin REST API base URL (used to create/manage users)
  ADMIN_API_URL: `${process.env.KEYCLOAK_BASE_URL}/admin/realms/${process.env.KEYCLOAK_REALM}`,

  // Admin token endpoint (uses master realm admin-cli)
  ADMIN_TOKEN_URL: `${process.env.KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`,
};

module.exports = KC;
```

---

## 6. FILE: `src/services/keycloak.service.js`

Create this file. It handles ALL Keycloak Admin API calls:

```js
// src/services/keycloak.service.js
// Handles all communication with Keycloak (login, register, refresh, logout)

const axios = require('axios');
const KC = require('../config/keycloak.config');

// ─────────────────────────────────────────────────────────────
// INTERNAL: Get Keycloak Admin access token
// Used internally for creating/managing users via Admin API
// ─────────────────────────────────────────────────────────────
async function getAdminToken() {
  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: KC.ADMIN_USERNAME,
    password: KC.ADMIN_PASSWORD,
  });

  const { data } = await axios.post(KC.ADMIN_TOKEN_URL, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return data.access_token;
}

// ─────────────────────────────────────────────────────────────
// LOGIN: Authenticate user via Direct Access Grant
// Returns: { access_token, refresh_token, expires_in, token_type }
// ─────────────────────────────────────────────────────────────
async function loginUser(email, password) {
  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: KC.CLIENT_ID,
    client_secret: KC.CLIENT_SECRET,
    username: email,
    password: password,
    scope: 'openid profile email',
  });

  try {
    const { data } = await axios.post(KC.TOKEN_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  } catch (err) {
    const status = err.response?.status;
    const errorDesc = err.response?.data?.error_description;

    if (status === 401) throw new Error('Invalid email or password');
    if (status === 400) throw new Error(errorDesc || 'Bad login request');
    throw new Error('Keycloak login failed');
  }
}

// ─────────────────────────────────────────────────────────────
// REFRESH TOKEN: Exchange refresh token for new access token
// Returns: { access_token, refresh_token, expires_in }
// ─────────────────────────────────────────────────────────────
async function refreshToken(refreshTokenValue) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: KC.CLIENT_ID,
    client_secret: KC.CLIENT_SECRET,
    refresh_token: refreshTokenValue,
  });

  try {
    const { data } = await axios.post(KC.TOKEN_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  } catch (err) {
    throw new Error('Refresh token invalid or expired. Please login again.');
  }
}

// ─────────────────────────────────────────────────────────────
// LOGOUT: Revoke refresh token in Keycloak
// ─────────────────────────────────────────────────────────────
async function logoutUser(refreshTokenValue) {
  const params = new URLSearchParams({
    client_id: KC.CLIENT_ID,
    client_secret: KC.CLIENT_SECRET,
    refresh_token: refreshTokenValue,
  });

  try {
    await axios.post(KC.LOGOUT_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (err) {
    throw new Error('Logout failed');
  }
}

// ─────────────────────────────────────────────────────────────
// CREATE USER: Register a new user in Keycloak + assign client role
// role must be one of: 'billing-admin' | 'billing-manager' | 'billing-viewer'
// Returns: keycloakUserId (string UUID)
// ─────────────────────────────────────────────────────────────
async function createKeycloakUser(email, password, role = 'billing-viewer') {
  const adminToken = await getAdminToken();
  const headers = { Authorization: `Bearer ${adminToken}` };

  // Step 1: Create user in Keycloak
  await axios.post(
    `${KC.ADMIN_API_URL}/users`,
    {
      username: email,
      email: email,
      enabled: true,
      emailVerified: true,
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false,
        },
      ],
    },
    { headers }
  );

  // Step 2: Fetch the created user to get their Keycloak UUID
  const { data: users } = await axios.get(
    `${KC.ADMIN_API_URL}/users?email=${encodeURIComponent(email)}&exact=true`,
    { headers }
  );

  if (!users || users.length === 0) {
    throw new Error('User created but could not be retrieved from Keycloak');
  }

  const keycloakUserId = users[0].id;

  // Step 3: Get the quantum-billing-client UUID (needed for role assignment)
  const { data: clients } = await axios.get(
    `${KC.ADMIN_API_URL}/clients?clientId=${KC.CLIENT_ID}`,
    { headers }
  );

  if (!clients || clients.length === 0) {
    throw new Error(`Client ${KC.CLIENT_ID} not found in Keycloak`);
  }

  const clientUUID = clients[0].id;

  // Step 4: Get the role object from the client
  const { data: roleObj } = await axios.get(
    `${KC.ADMIN_API_URL}/clients/${clientUUID}/roles/${role}`,
    { headers }
  );

  // Step 5: Assign the client role to the user
  await axios.post(
    `${KC.ADMIN_API_URL}/users/${keycloakUserId}/role-mappings/clients/${clientUUID}`,
    [roleObj],
    { headers }
  );

  return keycloakUserId;
}

// ─────────────────────────────────────────────────────────────
// UPDATE PASSWORD: Force update a user's password in Keycloak
// ─────────────────────────────────────────────────────────────
async function updateUserPassword(keycloakUserId, newPassword) {
  const adminToken = await getAdminToken();

  await axios.put(
    `${KC.ADMIN_API_URL}/users/${keycloakUserId}/reset-password`,
    {
      type: 'password',
      value: newPassword,
      temporary: false,
    },
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

// ─────────────────────────────────────────────────────────────
// DISABLE USER: Deactivate a user in Keycloak
// ─────────────────────────────────────────────────────────────
async function disableKeycloakUser(keycloakUserId) {
  const adminToken = await getAdminToken();

  await axios.put(
    `${KC.ADMIN_API_URL}/users/${keycloakUserId}`,
    { enabled: false },
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

module.exports = {
  loginUser,
  refreshToken,
  logoutUser,
  createKeycloakUser,
  updateUserPassword,
  disableKeycloakUser,
};
```

---

## 7. FILE: `src/middlewares/auth.middleware.js`

Create this file. It verifies every incoming JWT using Keycloak's JWKS public key:

```js
// src/middlewares/auth.middleware.js
// Verifies Keycloak JWT tokens using JWKS (public key — no secrets needed)

const jwksRsa = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const KC = require('../config/keycloak.config');

// Initialize JWKS client — caches public keys for 10 minutes
const jwksClient = jwksRsa({
  jwksUri: KC.JWKS_URL,
  cache: true,
  cacheMaxAge: 600000,       // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

async function authMiddleware(req, res, next) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Include Authorization: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Decode JWT header to get key ID (kid)
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header?.kid) {
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    }

    // 3. Fetch the matching public key from Keycloak JWKS endpoint
    const signingKey = await jwksClient.getSigningKey(decoded.header.kid);
    const publicKey = signingKey.getPublicKey();

    // 4. Verify token signature, issuer, and expiry
    const verified = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: `${KC.BASE_URL}/realms/${KC.REALM}`,
    });

    // 5. Extract client roles from token
    // Keycloak puts client roles here: resource_access['quantum-billing-client'].roles
    const clientRoles = verified.resource_access?.[KC.CLIENT_ID]?.roles || [];
    const realmRoles = verified.realm_access?.roles || [];

    // 6. Attach user info to req.user — available in all downstream routes
    req.user = {
      keycloakId: verified.sub,       // Keycloak UUID — use to look up your DB users table
      email: verified.email,
      name: verified.name || null,
      roles: clientRoles,             // ['billing-admin'] or ['billing-manager'] etc.
      realmRoles: realmRoles,
      tokenExpiry: verified.exp,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please refresh.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    return res.status(401).json({ success: false, message: 'Authentication failed', error: err.message });
  }
}

module.exports = authMiddleware;
```

---

## 8. FILE: `src/middlewares/role.middleware.js`

Create this file. It protects routes by checking Keycloak roles and/or DB permissions:

```js
// src/middlewares/role.middleware.js
// Role and permission guards — use AFTER authMiddleware

// ─────────────────────────────────────────────────────────────
// ROLE GUARD: Check if user has one of the required Keycloak roles
// Usage: requireRole('billing-admin')
// Usage: requireRole('billing-admin', 'billing-manager')
// ─────────────────────────────────────────────────────────────
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        yourRoles: userRoles,
      });
    }

    next();
  };
}

// ─────────────────────────────────────────────────────────────
// PERMISSION GUARD: Check if user has a specific DB permission
// Requires req.user.permissions to be populated (load from DB in authMiddleware or a separate step)
// Usage: requirePermission('invoices.write')
// ─────────────────────────────────────────────────────────────
function requirePermission(permission) {
  return (req, res, next) => {
    const userPermissions = req.user?.permissions || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`,
      });
    }

    next();
  };
}

// Role hierarchy constants for reference
const ROLES = {
  ADMIN: 'billing-admin',
  MANAGER: 'billing-manager',
  VIEWER: 'billing-viewer',
};

module.exports = { requireRole, requirePermission, ROLES };
```

---

## 9. FILE: `src/controllers/auth.controller.js`

Create this controller with all auth endpoints:

```js
// src/controllers/auth.controller.js

const jwt = require('jsonwebtoken');
const kcService = require('../services/keycloak.service');

// ─────────────────────────────────────────────────────────────
// POST /auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // 1. Authenticate with Keycloak → get tokens
    const tokens = await kcService.loginUser(email, password);

    // 2. Decode access token to extract user info (no verify needed — Keycloak just issued it)
    const decoded = jwt.decode(tokens.access_token);

    const keycloakUserId = decoded.sub;
    const clientRoles = decoded.resource_access?.[process.env.KEYCLOAK_QUANTUM_CLIENT_ID]?.roles || [];

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

    return res.status(200).json({
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
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /auth/register
// Body: { email, password, role, orgId }
// role must be: 'billing-admin' | 'billing-manager' | 'billing-viewer'
// ─────────────────────────────────────────────────────────────
async function register(req, res) {
  try {
    const { email, password, role = 'billing-viewer', orgId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const validRoles = ['billing-admin', 'billing-manager', 'billing-viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
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

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        keycloakUserId,
        email,
        role,
      },
    });
  } catch (err) {
    // Handle Keycloak duplicate user error
    if (err.response?.status === 409) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /auth/refresh
// Body: { refresh_token }
// ─────────────────────────────────────────────────────────────
async function refresh(req, res) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ success: false, message: 'refresh_token is required' });
    }

    const tokens = await kcService.refreshToken(refresh_token);

    return res.status(200).json({
      success: true,
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// POST /auth/logout
// Body: { refresh_token }
// ─────────────────────────────────────────────────────────────
async function logout(req, res) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ success: false, message: 'refresh_token is required' });
    }

    await kcService.logoutUser(refresh_token);

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /auth/me  (Protected)
// Returns the currently authenticated user info from the token
// ─────────────────────────────────────────────────────────────
async function getMe(req, res) {
  try {
    // req.user is attached by authMiddleware
    // TODO: Optionally load full user profile from PostgreSQL
    // const dbUser = await db.query('SELECT * FROM users WHERE keycloak_user_id = $1', [req.user.keycloakId]);

    return res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { login, register, refresh, logout, getMe };
```

---

## 10. FILE: `src/routes/auth.routes.js`

Create this file with all routes wired up:

```js
// src/routes/auth.routes.js

const router = require('express').Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole, ROLES } = require('../middlewares/role.middleware');
const authController = require('../controllers/auth.controller');

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
  (req, res) => res.json({ success: true, message: 'Admin user list — connect your DB here' })
);

// billing-admin and billing-manager can access
router.get(
  '/dashboard',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  (req, res) => res.json({ success: true, message: 'Dashboard data — connect your DB here' })
);

// All authenticated users can access (all 3 roles)
router.get(
  '/reports',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.VIEWER),
  (req, res) => res.json({ success: true, message: 'Reports — connect your DB here' })
);

module.exports = router;
```

---

## 11. WIRE UP IN `app.js` (or `index.js`)

Add these lines to your main Express app file:

```js
require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount auth routes
const authRoutes = require('./src/routes/auth.routes');
app.use('/auth', authRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});
```

---

## 12. DATABASE: Add `keycloak_user_id` to `users` table

Run this SQL migration in your PostgreSQL database.
This is the bridge between Keycloak identity and all your business data:

```sql
ALTER TABLE users
ADD COLUMN keycloak_user_id VARCHAR(255) UNIQUE;

-- Index for fast lookups during every authenticated request
CREATE INDEX idx_users_keycloak_user_id ON users(keycloak_user_id);
```

---

## 13. ROLES & PERMISSIONS SEED DATA

After creating the 3 roles in your `roles` table (per org), seed the `role_permissions` table:

```sql
-- First create roles per organization (run for each org)
-- INSERT INTO roles (id, org_id, name, description) VALUES (...)

-- Then seed permissions for billing-admin role:
INSERT INTO role_permissions (id, role_id, permission) VALUES
  (gen_random_uuid(), '<billing-admin-role-id>', 'organizations.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'organizations.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'users.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'users.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'users.delete'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'roles.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'roles.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'customers.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'customers.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'customers.delete'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'contracts.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'contracts.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'invoices.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'invoices.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'payments.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'payments.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'credits.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'credits.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'products.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'products.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'meters.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'meters.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'rate_cards.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'rate_cards.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'alerts.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'alerts.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'reports.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'reports.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'webhooks.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'webhooks.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'api_keys.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'api_keys.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'audit_logs.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'anomalies.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'anomalies.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'gdpr_requests.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'gdpr_requests.write'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'compliance.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'integrations.read'),
  (gen_random_uuid(), '<billing-admin-role-id>', 'integrations.write');

-- billing-manager permissions:
INSERT INTO role_permissions (id, role_id, permission) VALUES
  (gen_random_uuid(), '<billing-manager-role-id>', 'organizations.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'customers.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'customers.write'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'contracts.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'contracts.write'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'invoices.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'invoices.write'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'payments.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'credits.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'credits.write'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'products.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'meters.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'rate_cards.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'alerts.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'alerts.write'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'reports.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'reports.write'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'webhooks.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'webhooks.write'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'api_keys.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'api_keys.write'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'audit_logs.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'anomalies.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'integrations.read'),
  (gen_random_uuid(), '<billing-manager-role-id>', 'integrations.write');

-- billing-viewer permissions:
INSERT INTO role_permissions (id, role_id, permission) VALUES
  (gen_random_uuid(), '<billing-viewer-role-id>', 'organizations.read'),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'customers.read'),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'contracts.read'),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'invoices.read'),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'credits.read'),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'products.read'),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'meters.read'),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'rate_cards.read'),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'alerts.read'),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'reports.read'),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'anomalies.read');
```

---

## 14. API ENDPOINTS SUMMARY

Once implemented, these are all the available endpoints:

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| POST | `/auth/login` | ❌ | None | Login with email + password |
| POST | `/auth/register` | ❌ | None | Register new user |
| POST | `/auth/refresh` | ❌ | None | Refresh access token |
| POST | `/auth/logout` | ❌ | None | Logout + revoke token |
| GET | `/auth/me` | ✅ | Any | Get current user info |
| GET | `/auth/admin/users` | ✅ | billing-admin | Admin-only route |
| GET | `/auth/dashboard` | ✅ | admin + manager | Dashboard |
| GET | `/auth/reports` | ✅ | All roles | Reports |

---

## 15. HOW FRONTEND CONNECTS

The frontend (React) should:

1. Call `POST /auth/login` → store `access_token` in **memory** (not localStorage)
2. Store `refresh_token` in **httpOnly cookie** (most secure) or memory
3. Attach token to every request: `Authorization: Bearer <access_token>`
4. On `401` response → call `POST /auth/refresh` → get new tokens → retry
5. On logout → call `POST /auth/logout` → clear tokens from memory

```js
// Frontend axios setup
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = window.__accessToken; // stored in memory variable
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401) {
    const { data } = await api.post('/auth/refresh', {
      refresh_token: window.__refreshToken,
    });
    window.__accessToken = data.data.access_token;
    window.__refreshToken = data.data.refresh_token;
    error.config.headers.Authorization = `Bearer ${data.data.access_token}`;
    return api(error.config); // retry original request
  }
  return Promise.reject(error);
});

export default api;
```

---

## IMPLEMENTATION CHECKLIST

- [ ] Run `npm install axios jwks-rsa jsonwebtoken dotenv`
- [ ] Create `src/config/keycloak.config.js`
- [ ] Create `src/services/keycloak.service.js`
- [ ] Create `src/middlewares/auth.middleware.js`
- [ ] Create `src/middlewares/role.middleware.js`
- [ ] Create `src/controllers/auth.controller.js`
- [ ] Create `src/routes/auth.routes.js`
- [ ] Mount routes in `app.js` with `app.use('/auth', authRoutes)`
- [ ] Run SQL: `ALTER TABLE users ADD COLUMN keycloak_user_id VARCHAR(255) UNIQUE`
- [ ] Run SQL: `CREATE INDEX idx_users_keycloak_user_id ON users(keycloak_user_id)`
- [ ] Seed `role_permissions` table with permissions SQL above
- [ ] In Keycloak, create 3 roles: `billing-admin`, `billing-manager`, `billing-viewer`
- [ ] Test `POST /auth/login` with a Keycloak user
- [ ] Test `GET /auth/me` with the returned access token
- [ ] Connect frontend axios interceptors

---

## PROMPT END
