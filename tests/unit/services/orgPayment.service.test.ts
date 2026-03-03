/**
 * Unit Tests for Org Payment Service
 */

import { OrgPaymentService } from '../../../src/services/orgPayment.service';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  default: {
    organizations: {
      findUnique: jest.fn(),
    },
    org_payments: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('OrgPaymentService', () => {
  let orgPaymentService: OrgPaymentService;
  let mockPrisma: any;

  beforeEach(() => {
    const prisma = require('../../../src/config/database').default;
    mockPrisma = prisma;
    orgPaymentService = new OrgPaymentService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an org payment successfully', async () => {
      const mockOrg = { id: 'org-123', name: 'Test Org' };
      const mockPayment = {
        id: 'payment-123',
        org_id: 'org-123',
        amount: 100.00,
        payment_method: 'credit_card',
        status: 'pending',
        organizations: mockOrg,
      };

      mockPrisma.organizations.findUnique.mockResolvedValue(mockOrg);
      mockPrisma.org_payments.create.mockResolvedValue(mockPayment);

      const result = await orgPaymentService.create({
        amount: 100.00,
        payment_method: 'credit_card',
      }, 'org-123');

      expect(result).toEqual(mockPayment);
      expect(mockPrisma.organizations.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-123' },
      });
      expect(mockPrisma.org_payments.create).toHaveBeenCalledWith({
        data: {
          org_id: 'org-123',
          amount: 100.00,
          currency: 'USD',
          payment_method: 'credit_card',
          status: 'pending',
          payment_date: expect.any(Date),
        },
        include: {
          organizations: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    });

    it('should throw error if organization not found', async () => {
      mockPrisma.organizations.findUnique.mockResolvedValue(null);

      await expect(orgPaymentService.create({
        amount: 100.00,
        payment_method: 'credit_card',
      }, 'org-123')).rejects.toThrow('Organization not found');
    });
  });

  describe('findAll', () => {
    it('should return paginated org payments', async () => {
      const mockPayments = [
        {
          id: 'payment-123',
          amount: 100.00,
          payment_method: 'credit_card',
          status: 'succeeded',
          organizations: { id: 'org-123', name: 'Test Org', slug: 'test-org' },
        },
      ];

      mockPrisma.org_payments.findMany.mockResolvedValue(mockPayments);
      mockPrisma.org_payments.count.mockResolvedValue(1);

      const result = await orgPaymentService.findAll('org-123', 1, 10, {});

      expect(result).toEqual({
        data: mockPayments,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });

  describe('findById', () => {
    it('should return org payment by id', async () => {
      const mockPayment = {
        id: 'payment-123',
        org_id: 'org-123',
        amount: 100.00,
        organizations: { id: 'org-123', name: 'Test Org', slug: 'test-org' },
      };

      mockPrisma.org_payments.findFirst.mockResolvedValue(mockPayment);

      const result = await orgPaymentService.findById('payment-123', 'org-123');

      expect(result).toEqual(mockPayment);
    });

    it('should throw error if payment not found', async () => {
      mockPrisma.org_payments.findFirst.mockResolvedValue(null);

      await expect(orgPaymentService.findById('payment-123', 'org-123')).rejects.toThrow('Organization payment not found');
    });
  });

  describe('update', () => {
    it('should update org payment successfully', async () => {
      const existingPayment = {
        id: 'payment-123',
        org_id: 'org-123',
        status: 'pending',
      };
      const updatedPayment = {
        ...existingPayment,
        status: 'succeeded',
        organizations: { id: 'org-123', name: 'Test Org', slug: 'test-org' },
      };

      mockPrisma.org_payments.findFirst.mockResolvedValue(existingPayment);
      mockPrisma.org_payments.update.mockResolvedValue(updatedPayment);

      const result = await orgPaymentService.update('payment-123', { status: 'succeeded' }, 'org-123');

      expect(result).toEqual(updatedPayment);
    });

    it('should throw error if payment not found', async () => {
      mockPrisma.org_payments.findFirst.mockResolvedValue(null);

      await expect(orgPaymentService.update('payment-123', { status: 'succeeded' }, 'org-123')).rejects.toThrow('Organization payment not found');
    });
  });

  describe('delete', () => {
    it('should delete org payment successfully', async () => {
      const existingPayment = {
        id: 'payment-123',
        org_id: 'org-123',
      };

      mockPrisma.org_payments.findFirst.mockResolvedValue(existingPayment);
      mockPrisma.org_payments.delete.mockResolvedValue(undefined);

      await expect(orgPaymentService.delete('payment-123', 'org-123')).resolves.toBeUndefined();
    });

    it('should throw error if payment not found', async () => {
      mockPrisma.org_payments.findFirst.mockResolvedValue(null);

      await expect(orgPaymentService.delete('payment-123', 'org-123')).rejects.toThrow('Organization payment not found');
    });
  });
});