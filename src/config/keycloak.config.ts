// src/config/keycloak.config.ts
// Central Keycloak configuration — all values come from .env

const KC = {
  BASE_URL: process.env.KEYCLOAK_BASE_URL!,
  REALM: process.env.KEYCLOAK_REALM!,
  CLIENT_ID: process.env.KEYCLOAK_QUANTUM_CLIENT_ID!,
  CLIENT_SECRET: process.env.KEYCLOAK_QUANTUM_CLIENT_SECRET!,
  ADMIN_USERNAME: process.env.KEYCLOAK_ADMIN_USERNAME!,
  ADMIN_PASSWORD: process.env.KEYCLOAK_ADMIN_PASSWORD!,

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

export default KC;
