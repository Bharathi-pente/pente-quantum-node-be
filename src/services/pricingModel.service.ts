import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class PricingModelService {
  async create(data: any, orgId: string) {
    const existingModel = await prisma.pricing_models.findFirst({
      where: {
        org_id: orgId,
        name: data.name,
      },
    });

    if (existingModel) {
      throw ApiError.conflict('Pricing model with this name already exists in your organization');
    }

    // Verify meter belongs to org
    const meter = await prisma.meters.findFirst({
      where: {
        id: data.meter_id,
        org_id: orgId,
      },
    });

    if (!meter) {
      throw ApiError.badRequest('Invalid meter ID or meter does not belong to your organization');
    }

    try {
      return await prisma.pricing_models.create({
        data: {
          ...data,
          org_id: orgId,
          status: data.status || 'active',
        },
        include: {
          meters: {
            select: {
              id: true,
              name: true,
              event_type: true,
            },
          },
          pricing_tiers: {
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw ApiError.badRequest('Invalid meter ID');
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
    if (filters?.pricing_type) {
      where.pricing_type = filters.pricing_type;
    }
    if (filters?.meter_id) {
      where.meter_id = filters.meter_id;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { unit_label: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [pricingModels, total] = await Promise.all([
      prisma.pricing_models.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          meters: {
            select: {
              id: true,
              name: true,
              event_type: true,
            },
          },
          pricing_tiers: {
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
      }),
      prisma.pricing_models.count({ where }),
    ]);

    return { pricingModels, total, page, limit };
  }

  async findById(id: string, orgId: string) {
    const pricingModel = await prisma.pricing_models.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        meters: {
          select: {
            id: true,
            name: true,
            event_type: true,
            aggregation: true,
            field: true,
          },
        },
        pricing_tiers: {
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    });

    if (!pricingModel) {
      throw ApiError.notFound('Pricing model not found');
    }

    return pricingModel;
  }

  async update(id: string, data: any, orgId: string) {
    // Check if pricing model exists and belongs to org
    await this.findById(id, orgId);

    // Check for name conflict if name is being updated
    if (data.name) {
      const existingModel = await prisma.pricing_models.findFirst({
        where: {
          org_id: orgId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existingModel) {
        throw ApiError.conflict('Pricing model with this name already exists in your organization');
      }
    }

    // Verify meter belongs to org if meter_id is being updated
    if (data.meter_id) {
      const meter = await prisma.meters.findFirst({
        where: {
          id: data.meter_id,
          org_id: orgId,
        },
      });

      if (!meter) {
        throw ApiError.badRequest('Invalid meter ID or meter does not belong to your organization');
      }
    }

    try {
      return await prisma.pricing_models.update({
        where: { id },
        data,
        include: {
          meters: {
            select: {
              id: true,
              name: true,
              event_type: true,
            },
          },
          pricing_tiers: {
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw ApiError.notFound('Pricing model not found');
      }
      throw error;
    }
  }

  async delete(id: string, orgId: string) {
    // Check if pricing model exists and belongs to org
    await this.findById(id, orgId);

    try {
      await prisma.pricing_models.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw ApiError.notFound('Pricing model not found');
      }
      throw error;
    }
  }
}

export default new PricingModelService();