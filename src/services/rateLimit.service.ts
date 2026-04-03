import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class RateLimitService {
  private buildProductAccessFilter(userId?: string) {
    if (!userId) {
      return {}; // No filter for super admins
    }
    return { created_by: userId };
  }

  /**
   * Get all rate limit policies for an organization
   */
  async findAll(user?: any, page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};
    let productIds: string[] = [];

    if (user?.id) {
      // Get products user can access first
      const productAccessFilter = this.buildProductAccessFilter(user.id);
      const orgProducts = await prisma.products.findMany({
        where: productAccessFilter,
        select: { id: true },
      });

      productIds = orgProducts.map((p) => p.id);

      if (productIds.length > 0) {
        where.product_id = { in: productIds };
      } else {
        // No products = no policies
        return { policies: [], total: 0 };
      }
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.product_id) {
      if (user?.id && !productIds.includes(filters.product_id)) {
        return { policies: [], total: 0 };
      }
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
  async findById(id: string, user?: any) {
    const where: any = { id };

    if (user?.id) {
      const productAccessFilter = this.buildProductAccessFilter(user.id);
      where.products = productAccessFilter;
    }

    const policy = await prisma.rate_limit_policies.findFirst({
      where,
      include: {
        products: true,
        rate_limit_rules: true,
      },
    });

    if (!policy) {
      throw ApiError.notFound('Rate limit policy not found');
    }

    return policy;
  }

  /**
   * Create a new rate limit policy
   */
  async create(data: any, user?: any) {
    // Verify product is accessible by this user
    if (user?.id) {
      const productAccessFilter = this.buildProductAccessFilter(user.id);
      const product = await prisma.products.findFirst({
        where: {
          id: data.product_id,
          ...productAccessFilter,
        },
      });

      if (!product) {
        throw ApiError.badRequest('Invalid product ID or product does not belong to you');
      }
    } else {
      // For super admins, just verify product exists
      const product = await prisma.products.findUnique({
        where: { id: data.product_id },
      });

      if (!product) {
        throw ApiError.badRequest('Invalid product ID');
      }
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
  async update(id: string, data: any, user?: any) {
    // Verify policy exists and belongs to user
    await this.findById(id, user);

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
  async delete(id: string, user?: any) {
    // Verify policy exists and belongs to user
    await this.findById(id, user);

    await prisma.rate_limit_policies.delete({
      where: { id },
    });
  }

  /**
   * Get all policies for a specific product
   */
  async findByProduct(productId: string, user?: any) {
    // Verify product is accessible by this user
    if (user?.id) {
      const productAccessFilter = this.buildProductAccessFilter(user.id);
      const product = await prisma.products.findFirst({
        where: {
          id: productId,
          ...productAccessFilter,
        },
      });

      if (!product) {
        throw ApiError.badRequest('Invalid product ID or product does not belong to you');
      }
    } else {
      // For super admins, just verify product exists
      const product = await prisma.products.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw ApiError.badRequest('Invalid product ID');
      }
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
