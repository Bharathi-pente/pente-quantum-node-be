# Keycloak Authentication Implementation

This implementation provides complete Keycloak-based authentication for the QuantumBilling backend API.

## 🎯 Overview

Keycloak serves as our Identity Provider (IAM), handling:
- User authentication (login/logout)
- Password management
- JWT token issuance and validation
- Role-based access control (RBAC)

## 📋 Features

- ✅ **Secure Authentication**: JWT tokens verified using Keycloak's JWKS endpoint
- ✅ **Direct Access Grants**: Password-based login flow
- ✅ **Token Management**: Access token + refresh token pattern
- ✅ **Role-Based Authorization**: 3-tier role hierarchy (Admin, Manager, Viewer)
- ✅ **Permission System**: Fine-grained permissions stored in PostgreSQL
- ✅ **User Management**: Create/disable users via Keycloak Admin API
- ✅ **TypeScript**: Full type safety throughout

## 🏗️ Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │────────▶│   Express    │────────▶│   Keycloak   │
│  (React)     │         │   Backend    │         │   Server     │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                         │
       │                        │                         │
       ▼                        ▼                         ▼
  JWT Token              Verify Token              Identity Store
   in Memory             via JWKS                  (Users, Roles)
                               │
                               ▼
                        ┌──────────────┐
                        │  PostgreSQL  │
                        │  (Business   │
                        │   Data)      │
                        └──────────────┘
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install axios jwks-rsa jsonwebtoken
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Keycloak Authentication
KEYCLOAK_BASE_URL=https://keycloak.v2.dev.pentesitesai.com
KEYCLOAK_REALM=quantum-billing
KEYCLOAK_QUANTUM_CLIENT_ID=quantum-billing-client
KEYCLOAK_QUANTUM_CLIENT_SECRET=aFSg7Zs1Nd4pUe2To95aEdSiPlj0qpMs
KEYCLOAK_ADMIN_USERNAME=admin@pentesitesai.com
KEYCLOAK_ADMIN_PASSWORD=Admin@123
```

### 3. Database Migration

Run the migration to add `keycloak_user_id` to users table:

```bash
psql $DATABASE_URL < prisma/migrations/add_keycloak_user_id.sql
```

### 4. Seed Role Permissions

1. First, create roles in your database for each organization:

```sql
-- Example for org_id = 'b86756c3-5f8c-45ac-9479-5095bd84aa27'
INSERT INTO roles (id, org_id, name, description) VALUES
  (gen_random_uuid(), 'b86756c3-5f8c-45ac-9479-5095bd84aa27', 'billing-admin', 'Full system access'),
  (gen_random_uuid(), 'b86756c3-5f8c-45ac-9479-5095bd84aa27', 'billing-manager', 'Manage billing operations'),
  (gen_random_uuid(), 'b86756c3-5f8c-45ac-9479-5095bd84aa27', 'billing-viewer', 'View-only access');
```

2. Update `prisma/migrations/seed_keycloak_permissions.sql` with actual role IDs
3. Run the seed file:

```bash
psql $DATABASE_URL < prisma/migrations/seed_keycloak_permissions.sql
```

### 5. Configure Keycloak

In Keycloak Admin Console:

1. **Create Realm**: `quantum-billing`
2. **Create Client**: `quantum-billing-client`
   - Client Authentication: ON
   - Direct Access Grants: Enabled
   - Valid Redirect URIs: `*`
   - Web Origins: `*` (restrict in production)
3. **Create Client Roles**:
   - `billing-admin`
   - `billing-manager`
   - `billing-viewer`

### 6. Start Server

```bash
npm run dev
```

## 📡 API Endpoints

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login with email & password |
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout & revoke token |

### Protected Endpoints (Requires Token)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/v1/auth/me` | All | Get current user |
| GET | `/api/v1/auth/admin/users` | Admin | Admin-only endpoint |
| GET | `/api/v1/auth/dashboard` | Admin, Manager | Dashboard access |
| GET | `/api/v1/auth/reports` | All | Reports access |

## 🔐 Usage Examples

### 1. Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
    "expires_in": 300,
    "token_type": "Bearer",
    "user": {
      "keycloakId": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": ["billing-viewer"]
    }
  }
}
```

### 2. Access Protected Endpoint

```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI..."
```

### 3. Refresh Token

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
  }'
```

### 4. Register New User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securePass123",
    "role": "billing-viewer",
    "orgId": "b86756c3-5f8c-45ac-9479-5095bd84aa27"
  }'
```

## 🛡️ Protecting Routes

### Method 1: Using Middleware in Routes

```typescript
import authMiddleware from '../middleware/keycloakAuth.middleware';
import { requireRole, ROLES } from '../middleware/keycloakRole.middleware';

// Protect entire router
router.use(authMiddleware);

// Admin-only route
router.get('/admin-only', requireRole(ROLES.ADMIN), controller.adminAction);

// Multiple roles allowed
router.get('/managers', requireRole(ROLES.ADMIN, ROLES.MANAGER), controller.action);
```

### Method 2: Using Permission Guards

```typescript
import { requirePermission } from '../middleware/keycloakRole.middleware';

// Check specific permission
router.post('/invoices', authMiddleware, requirePermission('invoices.write'), controller.create);
```

## 🎭 Role Hierarchy

### Billing Admin
- **Full Access**: All read and write operations
- **User Management**: Create, update, delete users
- **System Configuration**: Webhooks, API keys, integrations

### Billing Manager
- **Operational Access**: Manage customers, invoices, payments
- **Limited Configuration**: Alerts, webhooks, API keys
- **Read Access**: Products, meters, rate cards

### Billing Viewer
- **Read-Only**: View all data
- **No Write Access**: Cannot modify any resources

## 🔄 Token Flow

```
1. User logs in → Keycloak issues access_token + refresh_token
2. Frontend stores tokens (access in memory, refresh in httpOnly cookie)
3. Every request includes: Authorization: Bearer <access_token>
4. Middleware verifies token using Keycloak's JWKS public key
5. On token expiry → Frontend calls /auth/refresh → New tokens issued
6. On logout → Frontend calls /auth/logout → Tokens revoked in Keycloak
```

## 📊 Database Schema

### users table
```sql
keycloak_user_id VARCHAR(255) UNIQUE -- Links to Keycloak identity
```

### roles table (unchanged)
```sql
id UUID PRIMARY KEY
org_id UUID
name VARCHAR(50) -- 'billing-admin', 'billing-manager', 'billing-viewer'
```

### role_permissions table
```sql
id UUID PRIMARY KEY
role_id UUID REFERENCES roles(id)
permission VARCHAR(100) -- 'invoices.write', 'customers.read', etc.
```

## 🧪 Testing

### Manual Testing

1. **Test Login**:
   ```bash
   npm run test:auth:login
   ```

2. **Test Protected Route**:
   ```bash
   npm run test:auth:protected
   ```

3. **Test Role Guards**:
   ```bash
   npm run test:auth:roles
   ```

### Automated Tests

```bash
npm test -- --grep "Keycloak"
```

## 🚨 Troubleshooting

### Token Verification Fails

**Error**: `Invalid token` or `JsonWebTokenError`

**Solution**:
1. Check `KEYCLOAK_BASE_URL` and `KEYCLOAK_REALM` are correct
2. Verify Keycloak is accessible: `curl https://keycloak.v2.dev.pentesitesai.com`
3. Check token was issued by correct realm: Decode token and verify `iss` claim

### User Creation Fails

**Error**: `Client quantum-billing-client not found`

**Solution**:
1. Ensure client exists in Keycloak
2. Verify `KEYCLOAK_QUANTUM_CLIENT_ID` matches exactly
3. Check client has client roles configured

### Role Assignment Fails

**Error**: `Role billing-admin not found`

**Solution**:
1. Create client roles in Keycloak Admin Console
2. Assign roles to client `quantum-billing-client`, not realm
3. Verify role names match exactly (case-sensitive)

## 🔒 Security Best Practices

1. **Never commit secrets**: Use `.env` file, add to `.gitignore`
2. **HTTPS in production**: Always use HTTPS for Keycloak and API
3. **Rotate secrets**: Regularly rotate client secrets
4. **Token storage**: 
   - Access token: In-memory only (not localStorage)
   - Refresh token: httpOnly cookie or secure storage
5. **CORS**: Restrict to specific origins in production
6. **Rate limiting**: Already implemented via `apiLimiter`

## 📚 Additional Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [JWT.io](https://jwt.io/) - Decode and inspect tokens
- [JWKS RFC](https://datatracker.ietf.org/doc/html/rfc7517) - JSON Web Key Set spec

## 🤝 Integration with Existing Routes

To protect existing routes:

```typescript
// In your route file
import authMiddleware from '../middleware/keycloakAuth.middleware';
import { requireRole, ROLES } from '../middleware/keycloakRole.middleware';

// Before
router.get('/invoices', invoiceController.getAll);

// After (requires authentication)
router.get('/invoices', authMiddleware, invoiceController.getAll);

// After (requires admin role)
router.delete('/invoices/:id', authMiddleware, requireRole(ROLES.ADMIN), invoiceController.delete);
```

## 📝 Migration from Old Auth

If migrating from JWT-based auth:

1. Keep `JWT_SECRET` in `.env` temporarily for backward compatibility
2. Gradually migrate users to Keycloak
3. Update `keycloak_user_id` for migrated users
4. Once fully migrated, remove old JWT auth code

## ✅ Production Checklist

- [ ] All environment variables set in production
- [ ] HTTPS enabled for all services
- [ ] CORS restricted to production domains
- [ ] Keycloak client secrets rotated
- [ ] Database migration applied
- [ ] Role permissions seeded
- [ ] Token expiry configured appropriately
- [ ] Rate limiting configured
- [ ] Monitoring and logging enabled
- [ ] Backup and recovery tested

---

**Version**: 1.0.0  
**Last Updated**: 2026-04-01  
**Maintainer**: QuantumBilling Team
