/**
 * Test Setup
 * 
 * Global test configuration and setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/quantumbilling_test';
process.env.REDIS_HOST = process.env.TEST_REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.TEST_REDIS_PORT || '6379';
process.env.JWT_SECRET = 'test-secret-key';
process.env.CORS_ORIGIN = 'http://localhost:3000';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Mock logger to avoid console spam during tests
jest.mock('./src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
}));

// Global test utilities
global.beforeAll(async () => {
  // Setup test database
  // await setupTestDatabase();
});

global.afterAll(async () => {
  // Cleanup test database
  // await cleanupTestDatabase();
});
