import prisma from '../config/database';
import ApiError from '../utils/ApiError';

interface CreatePricingModelData {
  name: string;
  pricing_type: string;
  meter_id?: string;
  unit_price?: number;
  unit_label?: string;
  status?: string;
  org_id?: string;
}

interface UpdatePricingModelData {
  name?: string;
  pricing_type?: string;
  meter_id?: string;
  unit_price?: number;
  unit_label?: string;
  status?: string;
}

export class PricingModelService {
  async create(data: CreatePricingModelData, orgId: string, userId: string) {
    const existingModel = await prisma.pricing_models.findFirst({
      where: {
        created_by: userId,
        name: data.name,
      },
    });

    if (existingModel) {
      throw ApiError.conflict('Pricing model with this name already exists for your account');
    }

    // Verify meter belongs to user
    const meter = await prisma.meters.findFirst({
      where: {
        id: data.meter_id,
        created_by: userId,
      },
    });

    if (!meter) {
      throw ApiError.badRequest('Invalid meter ID or meter does not belong to your account');
    }

    try {
      return await prisma.pricing_models.create({
        data: {
          ...data,
          org_id: orgId,
          status: data.status || 'active',
          created_by: userId,
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

  async findAll(userId: string, page = 1, limit = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = { created_by: userId };

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

  async findById(id: string, userId: string) {
    const pricingModel = await prisma.pricing_models.findFirst({
      where: {
        id,
        created_by: userId,
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

  async update(id: string, data: UpdatePricingModelData, userId: string) {
    // Check if pricing model exists and belongs to user
    await this.findById(id, userId);

    // Check for name conflict if name is being updated
    if (data.name) {
      const existingModel = await prisma.pricing_models.findFirst({
        where: {
          created_by: userId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existingModel) {
        throw ApiError.conflict('Pricing model with this name already exists for your account');
      }
    }

    // Verify meter belongs to user if meter_id is being updated
    if (data.meter_id) {
      const meter = await prisma.meters.findFirst({
        where: {
          id: data.meter_id,
          created_by: userId,
        },
      });

      if (!meter) {
        throw ApiError.badRequest('Invalid meter ID or meter does not belong to your account');
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

  async delete(id: string, userId: string) {
    // Check if pricing model exists and belongs to user
    await this.findById(id, userId);

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