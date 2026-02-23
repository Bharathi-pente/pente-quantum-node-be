import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class FeatureService {
  async create(data: any, orgId: string) {
    const existingFeature = await prisma.features.findFirst({
      where: {
        org_id: orgId,
        name: data.name,
      },
    });

    if (existingFeature) {
      throw ApiError.conflict('Feature with this name already exists in your organization');
    }

    try {
      return await prisma.features.create({
        data: {
          ...data,
          org_id: orgId,
          status: data.status || 'active',
        },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw ApiError.badRequest('Invalid organization ID');
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
    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [features, total] = await Promise.all([
      prisma.features.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.features.count({ where }),
    ]);

    return { features, total, page, limit };
  }

  async findById(id: string, orgId: string) {
    const feature = await prisma.features.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!feature) {
      throw ApiError.notFound('Feature not found');
    }

    return feature;
  }

  async update(id: string, data: any, orgId: string) {
    // Check if feature exists and belongs to org
    await this.findById(id, orgId);

    // Check for name conflict if name is being updated
    if (data.name) {
      const existingFeature = await prisma.features.findFirst({
        where: {
          org_id: orgId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existingFeature) {
        throw ApiError.conflict('Feature with this name already exists in your organization');
      }
    }

    try {
      return await prisma.features.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw ApiError.notFound('Feature not found');
      }
      throw error;
    }
  }

  async delete(id: string, orgId: string) {
    // Check if feature exists and belongs to org
    await this.findById(id, orgId);

    try {
      await prisma.features.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw ApiError.notFound('Feature not found');
      }
      throw error;
    }
  }
}

export default new FeatureService();