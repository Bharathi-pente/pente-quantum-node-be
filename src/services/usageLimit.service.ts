import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class UsageLimitService {
  private buildOwnershipFilter(orgId?: string, userId?: string) {
    const conditions: any[] = [];

    if (orgId) {
      conditions.push({ org_id: orgId });
    }

    if (userId) {
      conditions.push({ created_by: userId });
    }

    if (conditions.length === 0) {
      return {};
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return { OR: conditions };
  }

  // Usage Limits CRUD
  async create(data: any, orgId: string, _userId?: string) {
    // Validate product exists and belongs to the org.
    const product = await prisma.products.findFirst({
      where: {
        id: data.product_id,
        org_id: orgId,
      },
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Validate meter exists and belongs to the org.
    const meter = await prisma.meters.findFirst({
      where: {
        id: data.meter_id,
        org_id: orgId,
      },
    });

    if (!meter) {
      throw ApiError.notFound('Meter not found');
    }

    // Check if usage limit already exists for this product-meter combination
    const existingLimit = await prisma.usage_limits.findFirst({
      where: {
        product_id: data.product_id,
        meter_id: data.meter_id,
      },
    });

    if (existingLimit) {
      throw ApiError.badRequest('Usage limit already exists for this product-meter combination');
    }

    const usageLimit = await prisma.usage_limits.create({
      data: {
        product_id: data.product_id,
        meter_id: data.meter_id,
        limit_type: data.limit_type,
        limit_value: data.limit_value,
        period: data.period,
        warning_threshold_pct: data.warning_threshold_pct,
        status: data.status || 'active',
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
        meters: {
          select: {
            id: true,
            name: true,
            event_type: true,
          },
        },
      },
    });

    return usageLimit;
  }

  async findAll(orgId: string, page: number = 1, limit: number = 10, filters: any = {}, _userId?: string) {
    const skip = (page - 1) * limit;
    // First, let's try to get ALL usage limits without any filtering to see if they exist
    await prisma.usage_limits.count();

    const where: any = {};
    
    // Filter by orgId
    if (orgId) {
      where.products = {
        org_id: orgId,
      };
    }
    console.log('[UsageLimitService.findAll] Filtering by orgId:', orgId);

    // If customer_id is provided, filter by customer's products
    if (filters.customer_id) {
      where.products = {
        ...where.products,
        customers: {
          some: {
            id: filters.customer_id,
          },
        },
      };
    }

    if (filters.product_id) {
      where.product_id = filters.product_id;
    }

    if (filters.meter_id) {
      where.meter_id = filters.meter_id;
    }

    if (filters.limit_type) {
      where.limit_type = filters.limit_type;
    }

    if (filters.period) {
      where.period = filters.period;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    console.log('[UsageLimitService.findAll] Final where clause:', JSON.stringify(where, null, 2));

    const [usageLimits, total] = await Promise.all([
      prisma.usage_limits.findMany({
        where,
        include: {
          products: {
            select: {
              id: true,
              name: true,
            },
          },
          meters: {
            select: {
              id: true,
              name: true,
              event_type: true,
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.usage_limits.count({ where }),
    ]);

    console.log('[UsageLimitService.findAll] Found usageLimits:', usageLimits.length);
    console.log('[UsageLimitService.findAll] Total count:', total);

    return {
      usageLimits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, orgId: string, _userId?: string) {
    const usageLimit = await prisma.usage_limits.findFirst({
      where: {
        id,
        products: {
          org_id: orgId,
        },
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
        meters: {
          select: {
            id: true,
            name: true,
            event_type: true,
          },
        },
      },
    });

    if (!usageLimit) {
      throw ApiError.notFound('Usage limit not found');
    }

    return usageLimit;
  }

  async update(id: string, data: any, orgId: string, _userId?: string) {
    // Check if usage limit exists and belongs to org
    const existingLimit = await prisma.usage_limits.findFirst({
      where: {
        id,
        products: {
          org_id: orgId,
        },
      },
    });

    if (!existingLimit) {
      throw ApiError.notFound('Usage limit not found');
    }

    const usageLimit = await prisma.usage_limits.update({
      where: { id },
      data: {
        limit_type: data.limit_type,
        limit_value: data.limit_value,
        period: data.period,
        warning_threshold_pct: data.warning_threshold_pct,
        status: data.status,
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
        meters: {
          select: {
            id: true,
            name: true,
            event_type: true,
          },
        },
      },
    });

    return usageLimit;
  }

  async delete(id: string, orgId: string, _userId?: string) {
    // Check if usage limit exists and belongs to org
    const usageLimit = await prisma.usage_limits.findFirst({
      where: {
        id,
        products: {
          org_id: orgId,
        },
      },
    });

    if (!usageLimit) {
      throw ApiError.notFound('Usage limit not found');
    }

    await prisma.usage_limits.delete({
      where: { id },
    });

    return true;
  }

  // Limit Overrides CRUD
  async createOverride(data: any, orgId: string) {
    // Validate customer exists and belongs to org
    const customer = await prisma.customers.findFirst({
      where: {
        id: data.customer_id,
        org_id: orgId,
      },
      select: {
        id: true,
        org_id: true,
        name: true,
        email: true,
        product_id: true,
        status: true,
        mrr: true,
        credit_balance: true,
        health_score: true,
        logo_initials: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    // Validate meter exists and belongs to org
    const meter = await prisma.meters.findFirst({
      where: {
        id: data.meter_id,
        org_id: orgId,
      },
    });

    if (!meter) {
      throw ApiError.notFound('Meter not found');
    }

    // Get the original limit from usage_limits
    const originalLimit = await prisma.usage_limits.findFirst({
      where: {
        meter_id: data.meter_id,
        products: {
          customers: {
            some: {
              id: data.customer_id,
            },
          },
        },
      },
      select: {
        limit_value: true,
      },
    });

    const limitOverride = await prisma.limit_overrides.create({
      data: {
        customer_id: data.customer_id,
        meter_id: data.meter_id,
        original_limit: originalLimit?.limit_value || 0,
        new_limit: data.new_limit,
        reason: data.reason,
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
      },
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        meters: {
          select: {
            id: true,
            name: true,
            event_type: true,
          },
        },
      },
    });

    return limitOverride;
  }

  async findAllOverrides(orgId: string, page: number = 1, limit: number = 10, filters: any = {}) {
    const skip = (page - 1) * limit;

    const where: any = {
      customers: {
        org_id: orgId,
      },
    };

    if (filters.customer_id) {
      where.customer_id = filters.customer_id;
    }

    if (filters.meter_id) {
      where.meter_id = filters.meter_id;
    }

    if (filters.active_only) {
      where.OR = [
        { expires_at: null },
        { expires_at: { gt: new Date() } },
      ];
    }

    const [limitOverrides, total] = await Promise.all([
      prisma.limit_overrides.findMany({
        where,
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          meters: {
            select: {
              id: true,
              name: true,
              event_type: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.limit_overrides.count({ where }),
    ]);

    return {
      limitOverrides,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOverrideById(id: string, orgId: string) {
    const limitOverride = await prisma.limit_overrides.findFirst({
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
            email: true,
          },
        },
        meters: {
          select: {
            id: true,
            name: true,
            event_type: true,
          },
        },
      },
    });

    if (!limitOverride) {
      throw ApiError.notFound('Limit override not found');
    }

    return limitOverride;
  }

  async updateOverride(id: string, data: any, orgId: string) {
    // Check if limit override exists and belongs to org
    const existingOverride = await prisma.limit_overrides.findFirst({
      where: {
        id,
        customers: {
          org_id: orgId,
        },
      },
    });

    if (!existingOverride) {
      throw ApiError.notFound('Limit override not found');
    }

    const limitOverride = await prisma.limit_overrides.update({
      where: { id },
      data: {
        new_limit: data.new_limit,
        reason: data.reason,
        expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
      },
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        meters: {
          select: {
            id: true,
            name: true,
            event_type: true,
          },
        },
      },
    });

    return limitOverride;
  }

  async deleteOverride(id: string, orgId: string) {
    // Check if limit override exists and belongs to org
    const limitOverride = await prisma.limit_overrides.findFirst({
      where: {
        id,
        customers: {
          org_id: orgId,
        },
      },
    });

    if (!limitOverride) {
      throw ApiError.notFound('Limit override not found');
    }

    await prisma.limit_overrides.delete({
      where: { id },
    });

    return true;
  }

  // Real-time usage methods
  async getCurrentUsage(orgId: string | undefined, filters?: any, pagination?: { page: number; limit: number }, userId?: string) {
    const { page = 1, limit = 10 } = pagination || {};
    // Get all usage limits for the organization
    const where: any = {};
    const productAccessFilter = this.buildOwnershipFilter(orgId, userId);
    if (Object.keys(productAccessFilter).length > 0) {
      where.products = productAccessFilter;
    }

    if (filters?.product_id) {
      where.product_id = filters.product_id;
    }
    if (filters?.meter_id) {
      where.meter_id = filters.meter_id;
    }

    const usageLimits = await prisma.usage_limits.findMany({
      where,
      include: {
        products: {
          select: {
            id: true,
            name: true,
            customers: {
              where: {
                ...(filters?.customer_id ? { id: filters.customer_id } : {}),
                ...(orgId ? { org_id: orgId } : {}),
              },
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        meters: {
          select: {
            id: true,
            name: true,
            event_type: true,
          },
        },
      },
    });

    // Generate simulated current usage data
    const currentUsage = await Promise.all(
      usageLimits.flatMap(limit =>
        limit.products.customers.map(async (customer) => {
          // Simulate current usage based on limit period and random data
          const now = new Date();
          const periodStart = limit.period === 'monthly'
            ? new Date(now.getFullYear(), now.getMonth(), 1)
            : new Date(now.getFullYear(), now.getMonth(), now.getDate());

          const periodEnd = limit.period === 'monthly'
            ? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
            : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

          // Simulate usage (in a real implementation, this would come from usage_events table)
          const currentUsage = Math.floor(Math.random() * Number(limit.limit_value) * 0.8);
          const usagePercentage = (currentUsage / Number(limit.limit_value)) * 100;

          let status = 'normal';
          if (usagePercentage >= (limit.warning_threshold_pct || 80)) {
            status = 'warning';
          }
          if (usagePercentage >= 100) {
            status = 'exceeded';
          }

          return {
            limit_id: limit.id,
            customer_id: customer.id,
            customer_name: customer.name,
            product_id: limit.product_id,
            product_name: limit.products.name,
            meter_id: limit.meter_id,
            meter_name: limit.meters.name,
            event_type: limit.meters.event_type,
            current_usage: currentUsage,
            limit_value: Number(limit.limit_value),
            usage_percentage: Math.round(usagePercentage * 100) / 100,
            status,
            period: limit.period,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
            warning_threshold: limit.warning_threshold_pct || 80,
          };
        })
      )
    );

    // Apply pagination
    const total = currentUsage.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = currentUsage.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLimitCurrentUsage(limitId: string, orgId: string | undefined, userId?: string) {
    // Get the specific usage limit
    const where: any = { id: limitId };
    const productAccessFilter = this.buildOwnershipFilter(orgId, userId);
    if (Object.keys(productAccessFilter).length > 0) {
      where.products = productAccessFilter;
    }

    const limit = await prisma.usage_limits.findFirst({
      where,
      include: {
        products: {
          select: {
            id: true,
            name: true,
            customers: {
              where: orgId ? { org_id: orgId } : {},
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        meters: {
          select: {
            id: true,
            name: true,
            event_type: true,
          },
        },
      },
    });

    if (!limit) {
      throw ApiError.notFound('Usage limit not found');
    }

    // Calculate period dates
    const now = new Date();
    const periodStart = limit.period === 'monthly'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const periodEnd = limit.period === 'monthly'
      ? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Simulate current usage (in production, this would aggregate from usage_events)
    const currentUsage = Math.floor(Math.random() * Number(limit.limit_value) * 0.8);
    const usagePercentage = (currentUsage / Number(limit.limit_value)) * 100;

    let status = 'normal';
    if (usagePercentage >= (limit.warning_threshold_pct || 80)) {
      status = 'warning';
    }
    if (usagePercentage >= 100) {
      status = 'exceeded';
    }

    // Calculate time remaining in period
    const timeRemaining = periodEnd.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));

    return {
      limit_id: limit.id,
      product_id: limit.product_id,
      product_name: limit.products.name,
      meter_id: limit.meter_id,
      meter_name: limit.meters.name,
      event_type: limit.meters.event_type,
      current_usage: currentUsage,
      limit_value: Number(limit.limit_value),
      usage_percentage: Math.round(usagePercentage * 100) / 100,
      status,
      period: limit.period,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      warning_threshold: limit.warning_threshold_pct || 80,
      time_remaining: limit.period === 'monthly' ? `${daysRemaining} days` : `${hoursRemaining} hours`,
      customers_count: limit.products.customers.length,
    };
  }

  async getUsageStats(orgId: string | undefined, filters?: any, userId?: string) {
    const usageData = await this.getCurrentUsage(orgId, filters, { page: 1, limit: 100000 }, userId);

    const totalLimits = usageData.data.length;
    const activeLimits = usageData.data.filter((item: any) => item.status !== 'exceeded').length;
    const limitsAtWarning = usageData.data.filter((item: any) => item.status === 'warning').length;
    const limitsExceeded = usageData.data.filter((item: any) => item.status === 'exceeded').length;

    const averageUsagePercentage = usageData.data.length > 0
      ? usageData.data.reduce((sum: number, item: any) => sum + item.usage_percentage, 0) / usageData.data.length
      : 0;

    // Get top usage limits
    const topUsageLimits = usageData.data
      .sort((a: any, b: any) => b.usage_percentage - a.usage_percentage)
      .slice(0, 10)
      .map((item: any) => ({
        limit_id: item.limit_id,
        usage_percentage: item.usage_percentage,
        customer_name: item.customer_name,
        product_name: item.product_name,
        status: item.status,
      }));

    return {
      total_limits: totalLimits,
      active_limits: activeLimits,
      limits_at_warning: limitsAtWarning,
      limits_exceeded: limitsExceeded,
      average_usage_percentage: Math.round(averageUsagePercentage * 100) / 100,
      top_usage_limits: topUsageLimits,
      period: filters?.period || 'monthly',
    };
  }
}

export default new UsageLimitService();
