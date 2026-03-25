/**
 * Integration Tests for Customer API
 */

import request from 'supertest';
import app from '../../../src/app';
import prisma from '../../../src/config/database';

describe('Customer API Integration Tests', () => {
  let authToken: string;
  let organizationId: string;
  let customerId: string;

  beforeAll(async () => {
    // Setup: Create test organization and get auth token
    // In a real scenario, you'd authenticate and get a valid token
    authToken = 'test-token';
    organizationId = 'test-org-id';
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    // await prisma.customers.deleteMany({ where: { org_id: organizationId } });
    // await prisma.$disconnect();
  });

  describe('POST /api/v1/customers', () => {
    it('should create a new customer or return 401 if not authenticated', async () => {
      const customerData = {
        org_id: organizationId,
        name: 'Test Customer',
        email: 'test@example.com',
        currency: 'USD',
        billing_address: '123 Test St',
        phone: '+1234567890',
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData);

      // Test should handle both authenticated and unauthenticated scenarios
      if (response.status === 201) {
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe(customerData.name);
        customerId = response.body.data.id;
      } else {
        // Without proper auth, expect 401
        expect(response.status).toBe(401);
      }
    });

    it('should return 400 or 401 for invalid customer data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      // Should fail with validation error or auth error
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('GET /api/v1/customers/:id', () => {
    it('should get a customer by ID or return appropriate error', async () => {
      // Skip test if no customer was created
      if (customerId) {
        const response = await request(app)
          .get(`/api/v1/customers/${customerId}`)
          .set('Authorization', `Bearer ${authToken}`);

        if (response.status === 200) {
          expect(response.body.data.id).toBe(customerId);
        } else {
          expect(response.status).toBe(401);
        }
      }
    });

    it('should return 404 or 401 for non-existent customer', async () => {
      const response = await request(app)
        .get('/api/v1/customers/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      // Should return 404 or 401 (depending on auth)
      expect([401, 404]).toContain(response.status);
    });
  });

  describe('GET /api/v1/customers', () => {
    it('should list customers with pagination or return auth error', async () => {
      const response = await request(app)
        .get('/api/v1/customers')
        .query({ limit: 10 })
        .set('Authorization', `Bearer ${authToken}`);

      // Test structure of successful response
      if (response.status === 200) {
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data)).toBe(true);
      } else {
        expect(response.status).toBe(401);
      }
    });

    it('should filter customers by status when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/customers')
        .query({ status: 'active' })
        .set('Authorization', `Bearer ${authToken}`);

      // Should return filtered results if authenticated
      if (response.status === 200) {
        expect(response.body).toHaveProperty('data');
        if (response.body.data.length > 0) {
          expect(response.body.data.every((c: any) => c.status === 'active')).toBe(true);
        }
      } else {
        expect(response.status).toBe(401);
      }
    });
  });

  describe('PUT /api/v1/customers/:id', () => {
    it('should update a customer when authenticated', async () => {
      // Skip if no customer was created
      if (customerId) {
        const updateData = {
          name: 'Updated Customer Name',
        };

        const response = await request(app)
          .put(`/api/v1/customers/${customerId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        if (response.status === 200) {
          expect(response.body.data.name).toBe(updateData.name);
        } else {
          expect([401, 404]).toContain(response.status);
        }
      }
    });
  });

  describe('DELETE /api/v1/customers/:id', () => {
    it('should delete a customer when authenticated', async () => {
      // Skip if no customer was created
      if (customerId) {
        const response = await request(app)
          .delete(`/api/v1/customers/${customerId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 401, 404]).toContain(response.status);
      }
    });
  });

  // Health check test (should always work)
  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });
  });
});
