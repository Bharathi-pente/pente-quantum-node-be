import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class RateLimitService {
  /**
   * Get all rate limit policies for an organization
   */
  async findAll(orgId: string, page: number, limit: number, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Get products for this org first
    const orgProducts = await prisma.products.findMany({
      where: { org_id: orgId },
      select: { id: true },
    });

    const productIds = orgProducts.map((p) => p.id);

    if (productIds.length > 0) {
      where.product_id = { in: productIds };
    } else {
      // No products = no policies
      return { policies: [], total: 0 };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.product_id) {
      where.product_id = filters.product_id;
    }

    const [policies, total] = await Promise.all([
      prisma.rate_limit_policies.findMany({
        where,
        include: {
          products: {
            select: {
              id: true,
              name: true,
            },
          },
          rate_limit_rules: true,
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.rate_limit_policies.count({ where }),
    ]);

    return { policies, total };
  }

  /**
   * Get a rate limit policy by ID
   */
  async findById(id: string, orgId: string) {
    const policy = await prisma.rate_limit_policies.findUnique({
      where: { id },
      include: {
        products: true,
        rate_limit_rules: true,
      },
    });

    if (!policy) {
      throw ApiError.notFound('Rate limit policy not found');
    }

    // Verify policy belongs to org's product
    if (policy.products.org_id !== orgId) {
      throw ApiError.forbidden('You do not have access to this rate limit policy');
    }

    return policy;
  }

  /**
   * Create a new rate limit policy
   */
  async create(data: any, orgId: string) {
    // Verify product belongs to org
    const product = await prisma.products.findFirst({
      where: {
        id: data.product_id,
        org_id: orgId,
      },
    });

    if (!product) {
      throw ApiError.badRequest('Invalid product ID or product does not belong to your organization');
    }

    const { rules, ...policyData } = data;

    const policy = await prisma.rate_limit_policies.create({
      data: {
        ...policyData,
        rate_limit_rules: rules
          ? {
              create: rules.map((rule: any) => ({
                endpoint: rule.endpoint,
                requests_limit: rule.requests_limit,
                time_window: rule.time_window,
                burst_limit: rule.burst_limit,
              })),
            }
          : undefined,
      },
      include: {
        products: true,
        rate_limit_rules: true,
      },
    });

    return policy;
  }

  /**
   * Update a rate limit policy
   */
  async update(id: string, data: any, orgId: string) {
    // Verify policy exists and belongs to org
    await this.findById(id, orgId);

    const { rules, ...policyData } = data;

    // If rules are provided, delete existing and create new ones
    if (rules) {
      await prisma.rate_limit_rules.deleteMany({
        where: { policy_id: id },
      });
    }

    const policy = await prisma.rate_limit_policies.update({
      where: { id },
      data: {
        ...policyData,
        rate_limit_rules: rules
          ? {
              create: rules.map((rule: any) => ({
                endpoint: rule.endpoint,
                requests_limit: rule.requests_limit,
                time_window: rule.time_window,
                burst_limit: rule.burst_limit,
              })),
            }
          : undefined,
      },
      include: {
        products: true,
        rate_limit_rules: true,
      },
    });

    return policy;
  }

  /**
   * Delete a rate limit policy
   */
  async delete(id: string, orgId: string) {
    // Verify policy exists and belongs to org
    await this.findById(id, orgId);

    await prisma.rate_limit_policies.delete({
      where: { id },
    });
  }

  /**
   * Get all policies for a specific product
   */
  async findByProduct(productId: string, orgId: string) {
    // Verify product belongs to org
    const product = await prisma.products.findFirst({
      where: {
        id: productId,
        org_id: orgId,
      },
    });

    if (!product) {
      throw ApiError.badRequest('Invalid product ID or product does not belong to your organization');
    }

    const policies = await prisma.rate_limit_policies.findMany({
      where: { product_id: productId },
      include: {
        products: true,
        rate_limit_rules: true,
      },
      orderBy: { name: 'asc' },
    });

    return policies;
  }
}

export default new RateLimitService();
