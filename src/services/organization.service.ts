import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class OrganizationService {
  async create(data: any) {
    const existingOrg = await prisma.organizations.findFirst({
      where: {
        OR: [
          { slug: data.slug },
          { billing_email: data.billing_email },
        ],
      },
    });

    if (existingOrg) {
      throw ApiError.conflict('Organization with this slug or email already exists');
    }

    return await prisma.organizations.create({
      data: {
        ...data,
        status: data.status || 'active',
      },
    });
  }

  async findAll(orgId?: string, page = 1, limit = 10, search?: string, filters?: Record<string, any>) {
    const skip = (page - 1) * limit;
    const where: any = orgId ? { id: orgId } : {};

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

    const [organizations, total] = await Promise.all([
      prisma.organizations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: {
              customers: true,
            },
          },
        },
      }),
      prisma.organizations.count({ where }),
    ]);

    // Get MRR sums for these organizations
    const orgIds = organizations.map(org => org.id);
    const mrrSums = await prisma.customers.groupBy({
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
    const eventsCounts = await prisma.usage_events.groupBy({
      by: ['org_id'],
      where: {
        org_id: { in: orgIds },
        created_at: { gte: thirtyDaysAgo }
      },
      _count: {
        id: true,
      },
    });

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

  async findById(id: string) {
    const organization = await prisma.organizations.findUnique({
      where: { id },
      include: {
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

  async update(id: string, data: any) {
    const organization = await this.findById(id);

    if (data.slug && data.slug !== organization.slug) {
      const existingOrg = await prisma.organizations.findUnique({
        where: { slug: data.slug },
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

  async delete(id: string) {
    await this.findById(id);
    return await prisma.organizations.delete({ where: { id } });
  }

  async getDashboard(orgId: string) {
    // Get organization metrics in parallel
    const [
      totalMRR,
      activeCustomersCount,
      totalCredits,
      pendingInvoicesCount,
      recentCustomers,
      recentInvoices,
      recentPayments,
      activeRateCards,
      customerHealthCounts,
    ] = await Promise.all([
      // Total MRR from active customers
      prisma.customers.aggregate({
        where: { org_id: orgId, status: 'active' },
        _sum: { mrr: true },
      }),
      // Count of active customers
      prisma.customers.count({
        where: { org_id: orgId, status: 'active' },
      }),
      // Total credits remaining
      prisma.credits.aggregate({
        where: { customers: { org_id: orgId }, status: 'active' },
        _sum: { remaining_amount: true },
      }),
      // Count of pending invoices
      prisma.invoices.count({
        where: {
          customers: { org_id: orgId },
          status: 'pending'
        },
      }),
      // Recent customers
      prisma.customers.findMany({
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
      }),
      // Recent invoices
      prisma.invoices.findMany({
        where: { customers: { org_id: orgId } },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          customers: {
            select: { name: true },
          },
        },
      }),
      // Recent payments
      prisma.payments.findMany({
        where: { customers: { org_id: orgId } },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          customers: {
            select: { name: true },
          },
        },
      }),
      // Active rate cards
      prisma.rate_cards.findMany({
        where: { org_id: orgId, status: 'active' },
        orderBy: { created_at: 'desc' },
        take: 3,
        select: {
          id: true,
          name: true,
          status: true,
          created_at: true,
        },
      }),
      // Customer health counts
      prisma.customers.groupBy({
        by: ['health_score'],
        where: { org_id: orgId },
        _count: { health_score: true },
      }),
    ]);

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
}

export default new OrganizationService();
