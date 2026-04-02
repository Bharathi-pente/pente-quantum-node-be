#!/usr/bin/env node

/**
 * Keycloak Authentication Test Script
 * Tests the Keycloak implementation endpoints
 * 
 * Usage: node scripts/test-keycloak.js
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@pentesitesai.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Admin@123';

let accessToken = '';
let refreshToken = '';

// Colorful console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function success(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function error(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function info(message) {
  console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

function section(message) {
  console.log(`\n${colors.blue}━━━ ${message} ━━━${colors.reset}\n`);
}

// Test 1: Login
async function testLogin() {
  section('Test 1: Login');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (response.data.success && response.data.data.access_token) {
      accessToken = response.data.data.access_token;
      refreshToken = response.data.data.refresh_token;
      
      success('Login successful');
      info(`Access Token: ${accessToken.substring(0, 50)}...`);
      info(`User: ${response.data.data.user.email}`);
      info(`Roles: ${response.data.data.user.roles.join(', ')}`);
      return true;
    } else {
      error('Login failed: Invalid response format');
      return false;
    }
  } catch (err) {
    error(`Login failed: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

// Test 2: Get Current User
async function testGetMe() {
  section('Test 2: Get Current User (/auth/me)');
  
  if (!accessToken) {
    error('Skipped: No access token available');
    return false;
  }

  try {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.data.success && response.data.data) {
      success('Get current user successful');
      info(`Keycloak ID: ${response.data.data.keycloakId}`);
      info(`Email: ${response.data.data.email}`);
      info(`Roles: ${response.data.data.roles.join(', ')}`);
      return true;
    } else {
      error('Get current user failed: Invalid response');
      return false;
    }
  } catch (err) {
    error(`Get current user failed: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

// Test 3: Refresh Token
async function testRefresh() {
  section('Test 3: Refresh Token');
  
  if (!refreshToken) {
    error('Skipped: No refresh token available');
    return false;
  }

  try {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });

    if (response.data.success && response.data.data.access_token) {
      const newAccessToken = response.data.data.access_token;
      success('Token refresh successful');
      info(`New Access Token: ${newAccessToken.substring(0, 50)}...`);
      info(`Token changed: ${newAccessToken !== accessToken}`);
      
      // Update token for subsequent tests
      accessToken = newAccessToken;
      return true;
    } else {
      error('Token refresh failed: Invalid response');
      return false;
    }
  } catch (err) {
    error(`Token refresh failed: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

// Test 4: Protected Route (Dashboard)
async function testProtectedRoute() {
  section('Test 4: Protected Route (/auth/dashboard)');
  
  if (!accessToken) {
    error('Skipped: No access token available');
    return false;
  }

  try {
    const response = await axios.get(`${BASE_URL}/auth/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.data.success) {
      success('Protected route access successful');
      info(`Message: ${response.data.message}`);
      return true;
    } else {
      error('Protected route access failed');
      return false;
    }
  } catch (err) {
    if (err.response?.status === 403) {
      error(`Access denied: ${err.response.data.message}`);
      info('This is expected if user does not have admin/manager role');
    } else {
      error(`Protected route failed: ${err.response?.data?.message || err.message}`);
    }
    return false;
  }
}

// Test 5: Invalid Token
async function testInvalidToken() {
  section('Test 5: Invalid Token');
  
  try {
    await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    
    error('Invalid token test failed: Request should have been rejected');
    return false;
  } catch (err) {
    if (err.response?.status === 401) {
      success('Invalid token correctly rejected');
      info(`Error: ${err.response.data.message}`);
      return true;
    } else {
      error(`Unexpected error: ${err.message}`);
      return false;
    }
  }
}

// Test 6: No Token
async function testNoToken() {
  section('Test 6: Missing Token');
  
  try {
    await axios.get(`${BASE_URL}/auth/me`);
    
    error('Missing token test failed: Request should have been rejected');
    return false;
  } catch (err) {
    if (err.response?.status === 401) {
      success('Missing token correctly rejected');
      info(`Error: ${err.response.data.message}`);
      return true;
    } else {
      error(`Unexpected error: ${err.message}`);
      return false;
    }
  }
}

// Test 7: Logout
async function testLogout() {
  section('Test 7: Logout');
  
  if (!refreshToken) {
    error('Skipped: No refresh token available');
    return false;
  }

  try {
    const response = await axios.post(`${BASE_URL}/auth/logout`, {
      refresh_token: refreshToken,
    });

    if (response.data.success) {
      success('Logout successful');
      info(`Message: ${response.data.message}`);
      return true;
    } else {
      error('Logout failed');
      return false;
    }
  } catch (err) {
    error(`Logout failed: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log(`${colors.yellow}\n╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.yellow}║  Keycloak Authentication Test Suite   ║${colors.reset}`);
  console.log(`${colors.yellow}╚════════════════════════════════════════╝${colors.reset}`);
  
  info(`API Base URL: ${BASE_URL}`);
  info(`Test Email: ${TEST_EMAIL}\n`);

  const results = {
    passed: 0,
    failed: 0,
  };

  // Run tests sequentially
  const tests = [
    { name: 'Login', fn: testLogin, critical: true },
    { name: 'Get Current User', fn: testGetMe, critical: false },
    { name: 'Refresh Token', fn: testRefresh, critical: false },
    { name: 'Protected Route', fn: testProtectedRoute, critical: false },
    { name: 'Invalid Token', fn: testInvalidToken, critical: false },
    { name: 'Missing Token', fn: testNoToken, critical: false },
    { name: 'Logout', fn: testLogout, critical: false },
  ];

  for (const test of tests) {
    const passed = await test.fn();
    
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
      if (test.critical) {
        error(`Critical test "${test.name}" failed. Aborting remaining tests.`);
        break;
      }
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  section('Test Summary');
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`Total:  ${results.passed + results.failed}\n`);

  if (results.failed === 0) {
    success('All tests passed! ✨');
    process.exit(0);
  } else {
    error(`${results.failed} test(s) failed`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((err) => {
  error(`Test suite crashed: ${err.message}`);
  process.exit(1);
});
