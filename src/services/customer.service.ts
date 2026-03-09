import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { AuditLogger } from '../utils/audit-logger';
import {
  CursorPaginationOptions,
  buildCursorWhere,
  buildPaginatedResponse,
} from '../utils/pagination';

export class CustomerService {
  async create(data: any, request?: any) {
    const existingCustomer = await prisma.customers.findFirst({
      where: {
        org_id: data.org_id,
        email: data.email,
      },
      select: {
        id: true,
        org_id: true,
        name: true,
        email: true,
        product_id: true,
        status: true,
        mrr: true,
        credit_balance: true,
        health_score: true,
        primary_contact: true,
        phone: true,
        billing_currency: true,
        billing_cycle: true,
        logo_initials: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (existingCustomer) {
      // Log failed attempt
      await AuditLogger.logFailure(
        data.org_id,
        request?.user?.email || 'unknown',
        'customer.create',
        data.name,
        null,
        { reason: 'Customer with this email already exists', email: data.email },
        request
      );
      throw ApiError.conflict('Customer with this email already exists in your organization');
    }

    // Generate logo initials
    const logo_initials = data.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    try {
      const customer = await prisma.customers.create({
        data: {
          org_id: data.org_id,
          name: data.name,
          email: data.email,
          product_id: data.product_id,
          rate_card_override: data.rate_card_override,
          status: data.status || 'active',
          mrr: data.mrr || 0,
          credit_balance: data.credit_balance || 0,
          health_score: data.health_score || 75,
          primary_contact: data.primary_contact,
          phone: data.phone,
          billing_currency: data.billing_currency || 'USD',
          billing_cycle: data.billing_cycle || 'monthly',
          logo_initials,
        },
        include: {
          products: {
            select: {
              name: true,
              base_price: true,
            },
          },
          rate_cards: {
            select: {
              name: true,
            },
          },
        },
      });

      // Log successful customer creation
      await AuditLogger.logSuccess(
        data.org_id,
        request?.user?.email || 'system',
        'customer.created',
        data.name,
        customer.id,
        {
          email: data.email,
          product_id: data.product_id,
          status: data.status || 'active',
          mrr: data.mrr || 0,
          billing_currency: data.billing_currency || 'USD',
          billing_cycle: data.billing_cycle || 'monthly',
        },
        request
      );

      return customer;
    } catch (error: any) {
      // Log failed customer creation
      await AuditLogger.logFailure(
        data.org_id,
        request?.user?.email || 'unknown',
        'customer.create',
        data.name,
        null,
        { error: error.message },
        request
      );

      if (error.code === 'P2003') {
        // Foreign key constraint violation
        throw ApiError.badRequest('Invalid organization or product ID');
      }
      throw error;
    }
  }

  async findAll(orgId: string, page = 1, limit = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = { org_id: orgId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.product_id) {
      where.product_id = filters.product_id;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customers.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          org_id: true,
          name: true,
          email: true,
          product_id: true,
          status: true,
          mrr: true,
          credit_balance: true,
          health_score: true,
          primary_contact: true,
          phone: true,
          billing_currency: true,
          billing_cycle: true,
          logo_initials: true,
          created_at: true,
          updated_at: true,
          products: {
            select: {
              name: true,
              base_price: true,
            },
          },
        },
      }),
      prisma.customers.count({ where }),
    ]);

    return { customers, total, page, limit };
  }

  /**
   * Cursor-based pagination for better performance with large datasets
   * Recommended for production use with 100k+ records
   */
  async findAllCursor(
    orgId: string, 
    options: CursorPaginationOptions & { filters?: any }
  ) {
    const { 
      limit = 20, 
      cursor, 
      sortField = 'created_at', 
      sortOrder = 'desc',
      filters 
    } = options;

    // Build base where clause
    let baseWhere: any = { org_id: orgId };

    if (filters?.status) {
      baseWhere.status = filters.status;
    }
    if (filters?.product_id) {
      baseWhere.product_id = filters.product_id;
    }
    if (filters?.search) {
      baseWhere.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Build cursor-based where clause
    const where = buildCursorWhere(cursor, sortField, sortOrder, baseWhere);

    // Fetch limit + 1 to determine if there's a next page
    const customers = await prisma.customers.findMany({
      where,
      take: limit + 1,
      orderBy: [
        { [sortField]: sortOrder },
        { id: sortOrder }, // Secondary sort for consistency
      ],
      select: {
        id: true,
        org_id: true,
        name: true,
        email: true,
        product_id: true,
        status: true,
        mrr: true,
        credit_balance: true,
        health_score: true,
        primary_contact: true,
        phone: true,
        billing_currency: true,
        billing_cycle: true,
        logo_initials: true,
        created_at: true,
        updated_at: true,
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

  async findById(id: string) {
    const customer = await prisma.customers.findUnique({
      where: { id },
      select: {
        id: true,
        org_id: true,
        name: true,
        email: true,
        product_id: true,
        status: true,
        mrr: true,
        credit_balance: true,
        health_score: true,
        primary_contact: true,
        phone: true,
        billing_currency: true,
        billing_cycle: true,
        logo_initials: true,
        created_at: true,
        updated_at: true,
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

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    return customer;
  }

  async update(id: string, data: any) {
    await this.findById(id);

    return await prisma.customers.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        products: {
          select: {
            name: true,
            base_price: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return await prisma.customers.delete({ where: { id } });
  }

  async updateCreditBalance(id: string, amount: number) {
    const customer = await this.findById(id);
    return await prisma.customers.update({
      where: { id },
      data: {
        credit_balance: (customer.credit_balance ? customer.credit_balance.toNumber() : 0) + amount,
      },
    });
  }

  async getStats(orgId: string) {
    const [totalCustomers, activeCustomers, trialCustomers, totalMRR] = await Promise.all([
      prisma.customers.count({ where: { org_id: orgId } }),
      prisma.customers.count({ where: { org_id: orgId, status: 'active' } }),
      prisma.customers.count({ where: { org_id: orgId, status: 'trial' } }),
      prisma.customers.aggregate({
        where: { org_id: orgId, status: 'active' },
        _sum: { mrr: true },
      }),
    ]);

    return {
      totalCustomers,
      activeCustomers,
      trialCustomers,
      totalMRR: totalMRR._sum.mrr || 0,
    };
  }
}

export default new CustomerService();
