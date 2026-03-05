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

    // Transform the data to include customer count
    const transformedOrganizations = organizations.map(org => ({
      ...org,
      customers: org._count.customers,
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
