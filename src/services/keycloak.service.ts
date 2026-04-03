// src/services/keycloak.service.ts
// Handles all communication with Keycloak (login, register, refresh, logout)

import axios from 'axios';
import KC from '../config/keycloak.config';
import logger from '../config/logger';

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

// ─────────────────────────────────────────────────────────────
// INTERNAL: Get Keycloak Admin access token
// Used internally for creating/managing users via Admin API
// ─────────────────────────────────────────────────────────────
async function getAdminToken(): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: 'admin-cli',
    username: KC.ADMIN_USERNAME,
    password: KC.ADMIN_PASSWORD,
  });

  const { data } = await axios.post<{ access_token: string }>(KC.ADMIN_TOKEN_URL, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return data.access_token;
}

// ─────────────────────────────────────────────────────────────
// LOGIN: Authenticate user via Direct Access Grant
// Returns: { access_token, refresh_token, expires_in, token_type }
// ─────────────────────────────────────────────────────────────
async function loginUser(email: string, password: string): Promise<KeycloakTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: KC.CLIENT_ID,
    client_secret: KC.CLIENT_SECRET,
    username: email,
    password: password,
    scope: 'openid profile email',
  });

  try {
    const { data } = await axios.post<KeycloakTokenResponse>(KC.TOKEN_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  } catch (err: any) {
    const status = err.response?.status;
    const errorDesc = err.response?.data?.error_description;
    const error = err.response?.data?.error;

    // Log the full error for debugging
    logger.error('Keycloak login error:', {
      status,
      error,
      errorDesc,
      fullResponse: err.response?.data
    });

    // Return the actual Keycloak error description
    if (errorDesc) throw new Error(errorDesc);
    if (status === 401) throw new Error('Invalid email or password');
    if (status === 400) throw new Error(errorDesc || 'Bad login request');
    throw new Error('Keycloak login failed');
  }
}

// ─────────────────────────────────────────────────────────────
// REFRESH TOKEN: Exchange refresh token for new access token
// Returns: { access_token, refresh_token, expires_in }
// ─────────────────────────────────────────────────────────────
async function refreshToken(refreshTokenValue: string): Promise<KeycloakTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: KC.CLIENT_ID,
    client_secret: KC.CLIENT_SECRET,
    refresh_token: refreshTokenValue,
  });

  try {
    const { data } = await axios.post<KeycloakTokenResponse>(KC.TOKEN_URL, params, {
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
async function logoutUser(refreshTokenValue: string): Promise<void> {
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
// role must be one of: 'billing-admin' | 'billing-manager' | 'billing-org-admin' | 'billing-viewer'
// Returns: keycloakUserId (string UUID)
// ─────────────────────────────────────────────────────────────
async function createKeycloakUser(
  email: string,
  password: string,
  role: string = 'billing-viewer'
): Promise<string> {
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
      requiredActions: [], // Explicitly set no required actions
      attributes: {
        // Additional attributes to ensure clean user creation
      },
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
  const { data: users } = await axios.get<Array<{ id: string }>>(
    `${KC.ADMIN_API_URL}/users?email=${encodeURIComponent(email)}&exact=true`,
    { headers }
  );

  if (!users || users.length === 0) {
    throw new Error('User created but could not be retrieved from Keycloak');
  }

  const keycloakUserId = users[0].id;

  // Step 3: Get the quantum-billing-client UUID (needed for role assignment)
  const { data: clients } = await axios.get<Array<{ id: string }>>(
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
async function updateUserPassword(keycloakUserId: string, newPassword: string): Promise<void> {
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
async function disableKeycloakUser(keycloakUserId: string): Promise<void> {
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

export default {
  loginUser,
  refreshToken,
  logoutUser,
  createKeycloakUser,
  updateUserPassword,
  disableKeycloakUser,
};
