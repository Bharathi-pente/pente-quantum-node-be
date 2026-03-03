import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class OrgPaymentService {
  async create(data: any, orgId: string) {
    // Validate organization exists
    const organization = await prisma.organizations.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw ApiError.notFound('Organization not found');
    }

    // Create org payment
    const orgPayment = await prisma.org_payments.create({
      data: {
        org_id: orgId,
        amount: data.amount,
        currency: data.currency || 'USD',
        payment_method: data.payment_method,
        status: data.status || 'pending',
        payment_date: data.payment_date ? new Date(data.payment_date) : new Date(),
        description: data.description,
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

    return orgPayment;
  }

  async findAll(orgId: string, page: number = 1, limit: number = 10, filters: any = {}) {
    const skip = (page - 1) * limit;

    const where: any = {
      org_id: orgId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.payment_method) {
      where.payment_method = filters.payment_method;
    }

    if (filters.date_from || filters.date_to) {
      where.payment_date = {};
      if (filters.date_from) {
        where.payment_date.gte = new Date(filters.date_from);
      }
      if (filters.date_to) {
        where.payment_date.lte = new Date(filters.date_to);
      }
    }

    const [orgPayments, total] = await Promise.all([
      prisma.org_payments.findMany({
        where,
        include: {
          organizations: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          payment_date: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.org_payments.count({ where }),
    ]);

    return {
      data: orgPayments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, orgId: string) {
    const orgPayment = await prisma.org_payments.findFirst({
      where: {
        id,
        org_id: orgId,
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

    if (!orgPayment) {
      throw ApiError.notFound('Organization payment not found');
    }

    return orgPayment;
  }

  async update(id: string, data: any, orgId: string) {
    // Check if org payment exists and belongs to org
    const existingPayment = await prisma.org_payments.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!existingPayment) {
      throw ApiError.notFound('Organization payment not found');
    }

    // Update org payment
    const updatedPayment = await prisma.org_payments.update({
      where: { id },
      data: {
        status: data.status,
        payment_date: data.payment_date ? new Date(data.payment_date) : undefined,
        failure_reason: data.failure_reason,
        description: data.description,
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

    return updatedPayment;
  }

  async delete(id: string, orgId: string) {
    // Check if org payment exists and belongs to org
    const existingPayment = await prisma.org_payments.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!existingPayment) {
      throw ApiError.notFound('Organization payment not found');
    }

    await prisma.org_payments.delete({
      where: { id },
    });
  }
}

export default new OrgPaymentService();