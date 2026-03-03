import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class OrgPaymentMethodService {
  async create(data: any, orgId: string) {
    // Validate organization exists
    const organization = await prisma.organizations.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw ApiError.notFound('Organization not found');
    }

    // Create org payment method
    const orgPaymentMethod = await prisma.org_payment_methods.create({
      data: {
        org_id: orgId,
        name: data.name,
        type: data.type,
        details: data.details || {},
        status: data.status || 'active',
      },
    });

    return orgPaymentMethod;
  }

  async findAll(orgId: string, page: number = 1, limit: number = 10, filters: any = {}) {
    const skip = (page - 1) * limit;

    const where: any = {
      org_id: orgId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { type: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [orgPaymentMethods, total] = await Promise.all([
      prisma.org_payment_methods.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.org_payment_methods.count({ where }),
    ]);

    return {
      data: orgPaymentMethods,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, orgId: string) {
    const orgPaymentMethod = await prisma.org_payment_methods.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!orgPaymentMethod) {
      throw ApiError.notFound('Organization payment method not found');
    }

    return orgPaymentMethod;
  }

  async update(id: string, data: any, orgId: string) {
    // Check if payment method exists and belongs to org
    const existing = await prisma.org_payment_methods.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!existing) {
      throw ApiError.notFound('Organization payment method not found');
    }

    const updated = await prisma.org_payment_methods.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        details: data.details,
        status: data.status,
      },
    });

    return updated;
  }

  async delete(id: string, orgId: string) {
    // Check if payment method exists and belongs to org
    const existing = await prisma.org_payment_methods.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!existing) {
      throw ApiError.notFound('Organization payment method not found');
    }

    // Check if payment method is used in any org payments
    const usageCount = await prisma.org_payments.count({
      where: {
        org_id: orgId,
        payment_method: existing.name, // Assuming payment_method field stores the name
      },
    });

    if (usageCount > 0) {
      throw ApiError.conflict('Cannot delete payment method that is in use');
    }

    await prisma.org_payment_methods.delete({
      where: { id },
    });
  }
}

export default new OrgPaymentMethodService();