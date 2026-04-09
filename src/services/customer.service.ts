import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { AuditLogger } from '../utils/audit-logger';
import {
  CursorPaginationOptions,
  buildCursorWhere,
  buildPaginatedResponse,
} from '../utils/pagination';
import { getBillingClient, type LagoPlanCode } from '../integrations/billing.client';
import logger from '../config/logger';

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

    // Validate product_id if provided
    if (data.product_id && data.product_id.trim() !== '') {
      const product = await prisma.products.findFirst({
        where: {
          id: data.product_id,
          org_id: data.org_id,
          status: 'active',
        },
      });
      if (!product) {
        throw ApiError.badRequest('Invalid product ID or product is not active');
      }
    }

    // Note: rate_card_override validation removed due to schema mismatch
    // Frontend gets "rate cards" from pricing_models endpoint but schema references rate_cards table
    // TODO: Fix schema or create proper rate cards endpoint

    // Generate logo initials
    const logo_initials = data.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    try {
      // Prepare customer data, excluding empty/undefined optional fields
      const customerData: any = {
        org_id: data.org_id,
        name: data.name,
        email: data.email,
        status: data.status || 'active',
        mrr: data.mrr || 0,
        credit_balance: data.credit_balance || 0,
        health_score: data.health_score || 75,
        billing_currency: data.billing_currency || 'USD',
        billing_cycle: data.billing_cycle || 'monthly',
        logo_initials,
      };

      // Only include product_id if it's a valid non-empty value
      if (data.product_id && data.product_id.trim() !== '') {
        customerData.product_id = data.product_id;
      }

      // TODO: rate_card_override removed due to schema mismatch
      // Frontend sends pricing_model IDs but schema expects rate_cards IDs
      // if (data.rate_card_override && data.rate_card_override.trim() !== '') {
      //   customerData.rate_card_override = data.rate_card_override;
      // }

      // Only include primary_contact if provided
      if (data.primary_contact && data.primary_contact.trim() !== '') {
        customerData.primary_contact = data.primary_contact;
      }

      // Only include phone if provided
      if (data.phone && data.phone.trim() !== '') {
        customerData.phone = data.phone;
      }

      const customer = await prisma.customers.create({
        data: customerData,
        include: {
          products: {
            select: {
              name: true,
              base_price: true,
            },
          },
          // rate_cards include removed due to schema mismatch
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
          // rate_card_override: data.rate_card_override, // Removed due to schema mismatch
          status: data.status || 'active',
          mrr: data.mrr || 0,
          billing_currency: data.billing_currency || 'USD',
          billing_cycle: data.billing_cycle || 'monthly',
        },
        request
      );

      // ═══════════════════════════════════════════════════════
      // BILLING INTEGRATION — Trigger 2: New Customer Created
      // ═══════════════════════════════════════════════════════
      // Fire-and-recover pattern: sync to billing service after commit
      // Only sync if BILLING_LEVEL=customer (marketplace model)
      const billingLevel = process.env.BILLING_LEVEL || 'org';
      if (billingLevel === 'customer') {
        this.syncCustomerToBilling(customer, data.org_id).catch((err) => {
          logger.error('Billing sync failed for new customer', {
            customer_id: customer.id,
            customer_name: customer.name,
            error: err.message,
          });
        });
      }

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

  async findAll(orgId: string | null, page = 1, limit = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Only filter by org_id if user is not a super admin (orgId is not null)
    if (orgId !== null) {
      where.org_id = orgId;
    }

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

    // Use transaction to reduce connection usage
    const result = await prisma.$transaction(async (tx) => {
      const [customers, totalResult] = await Promise.all([
        tx.customers.findMany({
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
        tx.customers.count({ where }),
      ]);

      return { customers, total: totalResult };
    });

    return {
      data: result.customers,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNextPage: page < Math.ceil(result.total / limit),
        hasPreviousPage: page > 1,
      },
    };
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
    const existingCustomer = await this.findById(id);

    const updated = await prisma.customers.update({
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

    // ═══════════════════════════════════════════════════════
    // BILLING INTEGRATION — Trigger 4: Subscription Plan Change
    // ═══════════════════════════════════════════════════════
    // If product_id changed, sync plan change to billing service
    if (data.product_id && data.product_id !== existingCustomer.product_id) {
      this.syncPlanChangeToBilling(updated).catch((err) => {
        logger.error('Plan change billing sync failed', {
          customer_id: updated.id,
          old_product: existingCustomer.product_id,
          new_product: data.product_id,
          error: err.message,
        });
      });
    }

    return updated;
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

  /**
   * ═══════════════════════════════════════════════════════
   * BILLING INTEGRATION — Private method for Trigger 2
   * ═══════════════════════════════════════════════════════
   * Sync new customer to billing service and Lago
   * Called after customer is successfully created
   * Pattern: Fire-and-recover (failures logged, not thrown)
   * Only called when BILLING_LEVEL=customer (marketplace model)
   */
  private async syncCustomerToBilling(customer: any, orgId: string): Promise<void> {
    const billing = getBillingClient();

    try {
      logger.info('Syncing customer to billing service', {
        customer_id: customer.id,
        customer_name: customer.name,
        org_id: orgId,
      });

      // Map product to Lago plan code
      const planCode = await this.getPlanCodeFromProduct(customer.product_id);

      const result = await billing.createCustomer({
        internal_id: customer.id,
        org_id: orgId,
        name: customer.name,
        email: customer.email,
        plan_code: planCode,
      });

      if (result.success && result.data) {
        // Write-back lago_customer_id to customers table
        const lagoCustomerId = result.data.customer.lago_id;

        await prisma.customers.update({
          where: { id: customer.id },
          data: {
            lago_customer_id: lagoCustomerId,
            lago_sync_status: 'synced',
            lago_synced_at: new Date(),
          },
        });

        logger.info('Customer synced to billing service successfully', {
          customer_id: customer.id,
          lago_customer_id: lagoCustomerId,
        });
      } else {
        logger.error('Billing service returned failure', {
          customer_id: customer.id,
          error: result.error,
        });

        // Update sync status to failed
        await prisma.customers.update({
          where: { id: customer.id },
          data: {
            lago_sync_status: 'failed',
            lago_synced_at: new Date(),
          },
        });
      }
    } catch (error: any) {
      logger.error('Exception during billing sync for customer', {
        customer_id: customer.id,
        error: error.message,
        stack: error.stack,
      });

      // Update sync status to failed
      try {
        await prisma.customers.update({
          where: { id: customer.id },
          data: {
            lago_sync_status: 'failed',
            lago_synced_at: new Date(),
          },
        });
      } catch (updateError: any) {
        logger.error('Failed to update customer sync status', {
          customer_id: customer.id,
          error: updateError.message,
        });
      }
    }
  }

  /**
   * Map product_id to Lago plan code
   * Returns 'starter' if no product or unknown product
   */
  private async getPlanCodeFromProduct(productId: string | null): Promise<LagoPlanCode> {
    if (!productId) return 'starter';

    try {
      const product = await prisma.products.findUnique({
        where: { id: productId },
        select: { name: true },
      });

      if (!product) return 'starter';

      const planMap: Record<string, LagoPlanCode> = {
        'Starter': 'starter',
        'Pro': 'pro',
        'Enterprise': 'enterprise',
      };

      return planMap[product.name] ?? 'starter';
    } catch (error) {
      logger.error('Error fetching product for plan mapping', { productId, error });
      return 'starter';
    }
  }

  /**
   * ═══════════════════════════════════════════════════════
   * BILLING INTEGRATION — Private method for Trigger 4
   * ═══════════════════════════════════════════════════════
   * Sync plan change to billing service when product_id updates
   * Pattern: Fire-and-recover (failures logged, not thrown)
   */
  private async syncPlanChangeToBilling(customer: any): Promise<void> {
    const billing = getBillingClient();
    const billingLevel = process.env.BILLING_LEVEL || 'org';

    try {
      logger.info('Syncing plan change to billing service', {
        customer_id: customer.id,
        customer_name: customer.name,
        product_id: customer.product_id,
      });

      // Map product to Lago plan code
      const planCode = await this.getPlanCodeFromProduct(customer.product_id);

      // Determine internal_customer_id based on billing level
      const internal_customer_id = billingLevel === 'customer'
        ? customer.id
        : customer.org_id;

      const result = await billing.updateSubscription({
        internal_customer_id,
        plan_code: planCode,
      });

      if (result.success) {
        logger.info('Plan change synced to billing service successfully', {
          customer_id: customer.id,
          internal_customer_id,
          plan_code: planCode,
        });
      } else {
        logger.error('Billing service returned failure for plan change', {
          customer_id: customer.id,
          error: result.error,
        });
      }
    } catch (error: any) {
      logger.error('Exception during plan change billing sync', {
        customer_id: customer.id,
        error: error.message,
        stack: error.stack,
      });
    }
  }
}

export default new CustomerService();
