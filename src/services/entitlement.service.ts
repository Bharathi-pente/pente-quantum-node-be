import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class EntitlementService {
  async createGrant(data: any, orgId: string) {
    // Verify the customer belongs to the org
    const customer = await prisma.customers.findFirst({
      where: {
        id: data.customer_id,
        org_id: orgId,
      },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found in your organization');
    }

    // Verify the feature belongs to the org
    const feature = await prisma.features.findFirst({
      where: {
        id: data.feature_id,
        org_id: orgId,
      },
    });

    if (!feature) {
      throw ApiError.notFound('Feature not found in your organization');
    }

    try {
      return await prisma.entitlement_grants.create({
        data: {
          customer_id: data.customer_id,
          feature_id: data.feature_id,
          reason: data.reason,
          expires_at: data.expires_at ? new Date(data.expires_at) : null,
          granted_by: data.granted_by,
        },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
            },
          },
          features: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw ApiError.badRequest('Invalid customer or feature ID');
      }
      throw error;
    }
  }

  async findAllGrants(_orgId: string, page = 1, limit = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {
      customers: {
        org_id: _orgId,
      },
    };

    if (filters?.customer_id) {
      where.customer_id = filters.customer_id;
    }
    if (filters?.feature_id) {
      where.feature_id = filters.feature_id;
    }
    if (filters?.status) {
      if (filters.status === 'active') {
        where.OR = [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ];
      } else if (filters.status === 'expired') {
        where.expires_at = { lt: new Date() };
      }
    }

    const [grants, total] = await Promise.all([
      prisma.entitlement_grants.findMany({
        where,
        skip,
        take: limit,
        orderBy: { granted_at: 'desc' },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
            },
          },
          features: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.entitlement_grants.count({ where }),
    ]);

    return { grants, total, page, limit };
  }

  async findGrantById(id: string, orgId: string) {
    const grant = await prisma.entitlement_grants.findFirst({
      where: {
        id,
        customers: {
          org_id: orgId,
        },
      },
      include: {
        customers: {
          select: {
            id: true,
            name: true,
          },
        },
        features: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!grant) {
      throw ApiError.notFound('Entitlement grant not found');
    }

    return grant;
  }

  async updateGrant(id: string, data: any, orgId: string) {
    // Check if grant exists and belongs to org
    await this.findGrantById(id, orgId);

    // Verify customer and feature if they're being updated
    if (data.customer_id) {
      const customer = await prisma.customers.findFirst({
        where: {
          id: data.customer_id,
          org_id: orgId,
        },
      });
      if (!customer) {
        throw ApiError.notFound('Customer not found in your organization');
      }
    }

    if (data.feature_id) {
      const feature = await prisma.features.findFirst({
        where: {
          id: data.feature_id,
          org_id: orgId,
        },
      });
      if (!feature) {
        throw ApiError.notFound('Feature not found in your organization');
      }
    }

    try {
      return await prisma.entitlement_grants.update({
        where: { id },
        data: {
          ...data,
          expires_at: data.expires_at ? new Date(data.expires_at) : null,
        },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
            },
          },
          features: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw ApiError.badRequest('Invalid customer or feature ID');
      }
      throw error;
    }
  }

  async deleteGrant(id: string, orgId: string) {
    // Check if grant exists and belongs to org
    await this.findGrantById(id, orgId);

    try {
      await prisma.entitlement_grants.delete({
        where: { id },
      });
      return { message: 'Entitlement grant deleted successfully' };
    } catch (error: any) {
      throw ApiError.internal('Failed to delete entitlement grant');
    }
  }

  async checkEntitlement(customerId: string, featureId: string, orgId: string) {
    // Check if customer exists and belongs to org
    const customer = await prisma.customers.findFirst({
      where: {
        id: customerId,
        org_id: orgId,
      },
    });

    if (!customer) {
      return {
        allowed: false,
        reason: 'Customer not found',
        source: 'customer_check',
        cached: false,
        timestamp: new Date().toISOString(),
      };
    }

    // Check if feature exists and belongs to org
    const feature = await prisma.features.findFirst({
      where: {
        id: featureId,
        org_id: orgId,
      },
    });

    if (!feature) {
      return {
        allowed: false,
        reason: 'Feature not found',
        source: 'feature_check',
        cached: false,
        timestamp: new Date().toISOString(),
      };
    }

    // Check for custom grants first (highest priority)
    const grant = await prisma.entitlement_grants.findFirst({
      where: {
        customer_id: customerId,
        feature_id: featureId,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ],
      },
    });

    if (grant) {
      return {
        allowed: true,
        reason: 'Custom grant',
        source: 'grant',
        grant_id: grant.id,
        expires_at: grant.expires_at,
        cached: false,
        timestamp: new Date().toISOString(),
      };
    }

    // Check plan-based entitlements
    const customerProduct = await prisma.customers.findFirst({
      where: { id: customerId },
      select: { product_id: true },
    });

    if (customerProduct?.product_id) {
      const productFeature = await prisma.product_features.findFirst({
        where: {
          product_id: customerProduct.product_id,
          feature_id: featureId,
        },
      });

      if (productFeature) {
        return {
          allowed: true,
          reason: 'Plan entitlement',
          source: 'plan',
          plan_id: customerProduct.product_id,
          cached: false,
          timestamp: new Date().toISOString(),
        };
      }
    }

    return {
      allowed: false,
      reason: 'No entitlement found',
      source: 'none',
      cached: false,
      timestamp: new Date().toISOString(),
    };
  }

  async getPlanFeatures(orgId: string) {
    // Get all products with their features
    const products = await prisma.products.findMany({
      where: {
        org_id: orgId,
      },
      include: {
        product_features: {
          include: {
            features: true,
          },
        },
      },
    });

    // Transform into the expected format
    const planFeatures: Record<string, any[]> = {};
    products.forEach(product => {
      planFeatures[product.id] = product.product_features.map(pf => ({
        id: pf.features.id,
        name: pf.features.name,
        category: pf.features.category,
        status: pf.features.status,
      }));
    });

    return planFeatures;
  }
}

export default new EntitlementService();