import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { AuditLogger } from '../utils/audit-logger';
import axios from 'axios';
import logger from '../config/logger';
import { getBillingClient, type LagoPlanCode } from '../integrations/billing.client';

export class OrganizationService {
  async create(data: any, request?: any) {
    const existingOrg = await prisma.organizations.findFirst({
      where: {
        OR: [
          { slug: data.slug },
          { billing_email: data.billing_email },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        billing_email: true,
        status: true,
        settings: true,
        // created_by: true, // Temporarily omitted due to missing column
        created_at: true,
        updated_at: true,
      },
    });

    if (existingOrg) {
      // Log failed attempt
      await AuditLogger.logFailure(
        null, // No org_id for organization creation
        request?.user?.email || 'unknown',
        'organization.create',
        data.name,
        null,
        { reason: 'Organization with this slug or email already exists', slug: data.slug, email: data.billing_email },
        request
      );
      throw ApiError.conflict('Organization with this slug or email already exists');
    }

    try {
      const organization = await prisma.organizations.create({
        data: {
          ...data,
          status: data.status || 'active',
          created_by: request?.user?.id || null,
        },
      });

      // Update the creator's org_id to point to this organization
      if (request?.user?.id) {
        await prisma.users.update({
          where: { id: request.user.id },
          data: { org_id: organization.id }
        });
      }

      // Log successful organization creation
      await AuditLogger.logSuccess(
        organization.id, // Now we have org_id
        request?.user?.email || 'system',
        'organization.created',
        data.name,
        organization.id,
        {
          slug: data.slug,
          billing_email: data.billing_email,
          status: data.status || 'active',
          assigned_to_creator: true,
        },
        request
      );

      // ═══════════════════════════════════════════════════════
      // BILLING INTEGRATION — Trigger 1: New Organization Created
      // ═══════════════════════════════════════════════════════
      // Fire-and-recover pattern: sync to billing service after commit
      // Never await this — failures are logged, not thrown
      this.syncOrgToBilling(organization).catch((err) => {
        logger.error('Billing sync failed for new organization', {
          org_id: organization.id,
          org_name: organization.name,
          error: err.message,
        });
      });

      return organization;
    } catch (error: any) {
      // Log failed organization creation
      await AuditLogger.logFailure(
        null,
        request?.user?.email || 'unknown',
        'organization.create',
        data.name,
        null,
        { error: error.message },
        request
      );
      throw error;
    }
  }

  async findAll(user?: any, page = 1, limit = 10, search?: string, filters?: Record<string, any>) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Permission-based filtering - REQUIRED for security
    if (!user) {
      // No user means unauthenticated - return nothing
      return { organizations: [], total: 0, page, limit };
    }

    const isSuperAdmin = user.roles?.includes('billing-admin') || user.roles?.includes('super_admin');
    
    if (isSuperAdmin) {
      // Super admins see organizations they created
      where.created_by = user.id;
    } else if (user.orgId) {
      // Regular users see only their organization
      where.id = user.orgId;
    } else {
      // Users without org_id see nothing
      return { organizations: [], total: 0, page, limit };
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { billing_email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add filters
    if (filters) {
      if (filters.status) {
        where.status = filters.status;
      }
      // Add more filters as needed
    }

    // Use transaction to reduce connection usage
    const result = await prisma.$transaction(async (tx) => {
      const organizations = await tx.organizations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          billing_email: true,
          status: true,
          settings: true,
          created_by: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              customers: true,
            },
          },
        },
      });

      const total = await tx.organizations.count({ where });

      // Get MRR sums for these organizations
      const orgIds = organizations.map(org => org.id);
      const mrrSums = await tx.customers.groupBy({
        by: ['org_id'],
        where: {
          org_id: { in: orgIds },
          status: 'active', // Only count active customers
        },
        _sum: {
          mrr: true,
        },
      });

      // Get events count for last 30 days per organization
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const eventsCounts = await tx.usage_events.groupBy({
        by: ['org_id'],
        where: {
          org_id: { in: orgIds },
          created_at: { gte: thirtyDaysAgo }
        },
        _count: {
          id: true,
        },
      });

      return { organizations, total, mrrSums, eventsCounts };
    });

    const { organizations, total, mrrSums, eventsCounts } = result;

    // Create maps
    const mrrMap = new Map<string, number>();
    mrrSums.forEach(sum => {
      mrrMap.set(sum.org_id, Number(sum._sum.mrr) || 0);
    });

    const eventsMap = new Map<string, number>();
    eventsCounts.forEach(count => {
      eventsMap.set(count.org_id, count._count.id);
    });

    // Transform the data to include customer count, MRR, and events
    const transformedOrganizations = organizations.map(org => ({
      ...org,
      customers: org._count.customers,
      mrr: mrrMap.get(org.id) || 0,
      totalEvents: eventsMap.get(org.id) || 0,
      growth: 0, // Placeholder for growth calculation
      _count: undefined, // Remove the _count field
    }));

    return { organizations: transformedOrganizations, total, page, limit };
  }

  async findById(id: string, user?: any) {
    // Build where clause with permission checking
    const where: any = { id };

    // Apply permission-based filtering
    if (user) {
      const isSuperAdmin = user.roles?.includes('billing-admin') || user.roles?.includes('super_admin');
      
      if (isSuperAdmin) {
        // Super admins can only see organizations they created
        where.created_by = user.id;
      } else if (user.orgId !== id) {
        // Regular users can only see their own organization
        throw ApiError.forbidden('You do not have permission to view this organization');
      }
    }

    const organization = await prisma.organizations.findFirst({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        billing_email: true,
        status: true,
        settings: true,
        created_by: true,
        created_at: true,
        updated_at: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    if (!organization) {
      throw ApiError.notFound('Organization not found');
    }

    return organization;
  }

  async update(id: string, data: any, user?: any) {
    const organization = await this.findById(id, user);

    if (data.slug && data.slug !== organization.slug) {
      const existingOrg = await prisma.organizations.findUnique({
        where: { slug: data.slug },
        select: {
          id: true,
          slug: true,
        },
      });
      if (existingOrg) {
        throw ApiError.conflict('Slug already in use');
      }
    }

    return await prisma.organizations.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async delete(id: string, user?: any) {
    await this.findById(id, user);
    return await prisma.organizations.delete({ where: { id } });
  }

  /**
   * Get user dashboard data from external API
   */
  async getExternalDashboard(orgId: string, customerId: string, userId: string) {
    const baseURL = process.env.EXTERNAL_EVENTS_BASE_URL || 'http://3.88.179.52:8011';
    const url = `${baseURL}/v1/organization/${orgId}/customers/${customerId}/users/${userId}/dashboard`;

    try {
      logger.info('Fetching external dashboard data', { url, orgId, customerId, userId });
      
      const response = await axios.get(url, {
        timeout: Number(process.env.EXTERNAL_EVENTS_TIMEOUT_MS || '10000'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      logger.info('External dashboard data fetched successfully', { 
        status: response.status,
        dataKeys: Object.keys(response.data || {})
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        logger.error('External API returned error', {
          status: error.response.status,
          data: error.response.data,
          url,
        });
        throw new ApiError(
          error.response.status,
          `External API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
        );
      } else if (error.request) {
        logger.error('No response from external API', { url, error: error.message });
        throw new ApiError(503, 'External API is not responding. Please try again later.');
      } else {
        logger.error('Error calling external API', { url, error: error.message });
        throw new ApiError(500, 'Failed to fetch dashboard data from external API');
      }
    }
  }

  async getDashboard(orgId: string) {
    // Get organization metrics sequentially to avoid connection issues
    const totalMRR = await prisma.customers.aggregate({
      where: { org_id: orgId, status: 'active' },
      _sum: { mrr: true },
    });
    const activeCustomersCount = await prisma.customers.count({
      where: { org_id: orgId, status: 'active' },
    });
    const totalCredits = await prisma.credits.aggregate({
      where: { customers: { org_id: orgId }, status: 'active' },
      _sum: { remaining_amount: true },
    });
    const pendingInvoicesCount = await prisma.invoices.count({
      where: {
        customers: { org_id: orgId },
        status: 'pending'
      },
    });
    const recentCustomers = await prisma.customers.findMany({
      where: { org_id: orgId },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        mrr: true,
        health_score: true,
        created_at: true,
      },
    });
    const recentInvoices = await prisma.invoices.findMany({
      where: { customers: { org_id: orgId } },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        customers: {
          select: { name: true },
        },
      },
    });
    const recentPayments = await prisma.payments.findMany({
      where: { customers: { org_id: orgId } },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        customers: {
          select: { name: true },
        },
      },
    });
    const activeRateCards = await prisma.rate_cards.findMany({
      where: { org_id: orgId, status: 'active' },
      orderBy: { created_at: 'desc' },
      take: 3,
      select: {
        id: true,
        name: true,
        status: true,
        created_at: true,
      },
    });
    const customerHealthCounts = await prisma.customers.groupBy({
      by: ['health_score'],
      where: { org_id: orgId },
      _count: { health_score: true },
    });

    // Process customer health counts
    const healthCounts = {
      healthy: 0,
      atRisk: 0,
      critical: 0,
    };

    customerHealthCounts.forEach((group) => {
      const score = group.health_score || 0;
      if (score > 70) healthCounts.healthy += group._count.health_score;
      else if (score >= 40) healthCounts.atRisk += group._count.health_score;
      else healthCounts.critical += group._count.health_score;
    });

    return {
      totalMRR: totalMRR._sum.mrr || 0,
      activeCustomers: activeCustomersCount,
      totalCredits: totalCredits._sum.remaining_amount || 0,
      pendingInvoices: pendingInvoicesCount,
      recentCustomers,
      recentInvoices,
      recentPayments,
      activeRateCards,
      customerHealth: healthCounts,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════
   * BILLING INTEGRATION — Private method for Trigger 1
   * ═══════════════════════════════════════════════════════
   * Sync new organization to billing service and Lago
   * Called after organization is successfully created
   * Pattern: Fire-and-recover (failures logged, not thrown)
   */
  private async syncOrgToBilling(org: any): Promise<void> {
    const billingLevel = process.env.BILLING_LEVEL || 'org';
    
    // Only sync if billing at org level (default for B2B SaaS)
    if (billingLevel !== 'org') {
      logger.debug('Skipping org billing sync (BILLING_LEVEL != org)', { org_id: org.id });
      return;
    }

    const billing = getBillingClient();

    try {
      logger.info('Syncing organization to billing service', {
        org_id: org.id,
        org_name: org.name,
        billing_email: org.billing_email,
      });

      // Step 1: Create organization in billing service
      const orgResult = await billing.createOrganization({
        internal_id: org.id,
        name: org.name,
        slug: org.slug,
        billing_email: org.billing_email,
        status: org.status || 'active',
        settings: org.settings || {},
      });

      if (!orgResult.success) {
        logger.error('Failed to create organization in billing service', {
          org_id: org.id,
          error: orgResult.error,
        });
        // Continue with customer creation even if org creation fails
      } else {
        logger.info('Organization created in billing service', {
          org_id: org.id,
          billing_org_id: orgResult.data?.organization?.id,
        });
      }

      // Step 2: Create customer in Lago (as before)
      const defaultPlan: LagoPlanCode = 'starter'; // Default plan for new orgs
      
      // Extract settings for metadata
      const settings = (org.settings as Record<string, any>) ?? {};
      
      const result = await billing.createCustomer({
        internal_id: org.id,
        org_id: org.id,
        name: org.name,
        email: org.billing_email,
        plan_code: defaultPlan,
        metadata: {
          slug: org.slug,
          status: org.status,
          country: settings.country || 'US',
          timezone: settings.timezone || 'America/New_York',
          currency: settings.currency || 'USD',
          created_at: org.created_at?.toISOString(),
        },
      });

      if (result.success && result.data) {
        // Write-back lago_customer_id to organization settings
        const lagoCustomerId = result.data.customer.lago_id;
        
        await prisma.organizations.update({
          where: { id: org.id },
          data: {
            settings: {
              ...(org.settings as Record<string, unknown> ?? {}),
              lago_customer_id: lagoCustomerId,
              lago_sync_status: 'synced',
              lago_synced_at: new Date().toISOString(),
            },
          },
        });

        logger.info('Organization synced to billing service successfully', {
          org_id: org.id,
          lago_customer_id: lagoCustomerId,
        });
      } else {
        logger.error('Billing service returned failure', {
          org_id: org.id,
          error: result.error,
        });

        // Update sync status to failed
        await prisma.organizations.update({
          where: { id: org.id },
          data: {
            settings: {
              ...(org.settings as Record<string, unknown> ?? {}),
              lago_sync_status: 'failed',
              lago_sync_error: result.error,
              lago_last_attempt: new Date().toISOString(),
            },
          },
        });
      }
    } catch (error: any) {
      logger.error('Exception during billing sync for organization', {
        org_id: org.id,
        error: error.message,
        stack: error.stack,
      });

      // Update sync status to failed
      try {
        await prisma.organizations.update({
          where: { id: org.id },
          data: {
            settings: {
              ...(org.settings as Record<string, unknown> ?? {}),
              lago_sync_status: 'failed',
              lago_sync_error: error.message,
              lago_last_attempt: new Date().toISOString(),
            },
          },
        });
      } catch (updateError: any) {
        logger.error('Failed to update org sync status', {
          org_id: org.id,
          error: updateError.message,
        });
      }
    }
  }
}

export default new OrganizationService();
