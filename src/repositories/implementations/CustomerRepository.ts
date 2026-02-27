/**
 * Customer Repository Implementation
 * 
 * Handles all data access operations for customers.
 * Abstracts Prisma operations from business logic layer.
 */

import { PrismaClient, customers } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { 
  ICustomerRepository, 
  CustomerFilters, 
  CustomerStats 
} from '../interfaces/ICustomerRepository';
import { CursorPaginatedResult } from '../interfaces/IBaseRepository';
import {
  buildCursorWhere,
  buildPaginatedResponse,
} from '../../utils/pagination';

export class CustomerRepository extends BaseRepository<customers> implements ICustomerRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'customers');
  }

  async findByEmail(orgId: string, email: string): Promise<customers | null> {
    return await this.findFirst({
      org_id: orgId,
      email,
    });
  }

  async findWithCursor(
    orgId: string,
    options: {
      cursor?: string;
      limit?: number;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: CustomerFilters;
    }
  ): Promise<CursorPaginatedResult<customers>> {
    const {
      cursor,
      limit = 20,
      sortField = 'created_at',
      sortOrder = 'desc',
      filters = {},
    } = options;

    // Build base where clause
    let baseWhere: any = { org_id: orgId };

    if (filters.status) {
      baseWhere.status = filters.status;
    }
    if (filters.product_id) {
      baseWhere.product_id = filters.product_id;
    }
    if (filters.search) {
      baseWhere.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Build cursor-based where clause
    const where = buildCursorWhere(cursor, sortField, sortOrder, baseWhere);

    // Fetch limit + 1 to determine if there's a next page
    const customers = await this.getModel().findMany({
      where,
      take: limit + 1,
      orderBy: [
        { [sortField]: sortOrder },
        { id: sortOrder },
      ],
      include: {
        products: {
          select: {
            name: true,
            base_price: true,
          },
        },
      },
    });

    return buildPaginatedResponse(customers, limit, sortField, cursor);
  }

  async updateCreditBalance(id: string, amount: number): Promise<customers> {
    const customer = await this.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const currentBalance = customer.credit_balance 
      ? (typeof customer.credit_balance === 'number' 
          ? customer.credit_balance 
          : customer.credit_balance.toNumber())
      : 0;

    return await this.update(id, {
      credit_balance: currentBalance + amount,
    } as any);
  }

  async getStats(orgId: string): Promise<CustomerStats> {
    const [
      totalCustomers,
      activeCustomers,
      trialCustomers,
      churnedCustomers,
      mrrData,
    ] = await Promise.all([
      this.count({ org_id: orgId }),
      this.count({ org_id: orgId, status: 'active' }),
      this.count({ org_id: orgId, status: 'trial' }),
      this.count({ org_id: orgId, status: 'churned' }),
      this.getModel().aggregate({
        where: { org_id: orgId, status: 'active' },
        _sum: { mrr: true },
        _avg: { mrr: true },
      }),
    ]);

    return {
      totalCustomers,
      activeCustomers,
      trialCustomers,
      churnedCustomers,
      totalMRR: mrrData._sum.mrr || 0,
      averageMRR: mrrData._avg.mrr || 0,
    };
  }

  async findByProduct(productId: string): Promise<customers[]> {
    return await this.findMany({
      product_id: productId,
    });
  }

  async findByStatus(orgId: string, status: string): Promise<customers[]> {
    return await this.findMany({
      org_id: orgId,
      status,
    });
  }

  /**
   * Find customer with full relations
   */
  async findByIdWithRelations(id: string): Promise<customers | null> {
    return await this.getModel().findUnique({
      where: { id },
      include: {
        products: true,
        contracts: {
          where: { status: 'active' },
          orderBy: { created_at: 'desc' },
        },
        invoices: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        credits: {
          where: { status: 'active' },
        },
      },
    });
  }

  /**
   * Bulk create customers
   */
  async bulkCreate(data: Partial<customers>[]): Promise<{ count: number }> {
    return await this.getModel().createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Search customers by name or email
   */
  async search(orgId: string, query: string, limit: number = 10): Promise<customers[]> {
    return await this.findMany(
      {
        org_id: orgId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      { take: limit }
    );
  }
}
