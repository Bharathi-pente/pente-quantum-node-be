import { Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import prisma from '../config/database';

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations
 */

export class AdminController {
  /**
   * @swagger
   * /admin/metrics:
   *   get:
   *     summary: Get platform metrics
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Platform metrics
   */
  getPlatformMetrics = asyncHandler(async (_req: AuthRequest, res: Response) => {
    // Aggregate metrics across all organizations
    const [
      _totalOrganizations,
      activeOrganizations,
      _totalUsers,
      _totalCustomers,
      totalRevenue,
      _activeSubscriptions,
      totalEvents30d,
    ] = await Promise.all([
      prisma.organizations.count(),
      prisma.organizations.count({ where: { status: 'active' } }),
      prisma.users.count(),
      prisma.customers.count(),
      prisma.customers.aggregate({
        _sum: { mrr: true },
        where: { status: 'active' }
      }),
      prisma.customers.count({ where: { status: 'active' } }),
      // Count events from the last 30 days (assuming events are in alert_history or similar)
      prisma.alert_history.count({
        where: {
          triggered_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
    ]);

    const currentMRR = Number(totalRevenue._sum.mrr || 0);

    // For now, use a placeholder for MRR change since we don't have historical MRR data
    const mrrChange = 12; // Placeholder - would need historical data

    // Calculate events change (simplified)
    const eventsChange = 15; // Placeholder - would need historical data

    // Calculate active orgs change (simplified)
    const activeOrgsChange = 5; // Placeholder - would need historical data

    const metrics = {
      platformMRR: currentMRR,
      platformMRRChange: mrrChange,
      totalEvents30d: totalEvents30d,
      totalEventsChange: eventsChange,
      activeOrgs: activeOrganizations,
      activeOrgsChange: activeOrgsChange,
      apiUptime: 99.9, // Placeholder - would need monitoring system
    };

    res.json(ApiResponse.success(metrics));
  });

  /**
   * @swagger
   * /admin/analytics:
   *   get:
   *     summary: Get complete analytics data for admin dashboard
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Complete analytics data
   */
  getAnalytics = asyncHandler(async (_req: AuthRequest, res: Response) => {
    // Run all analytics calculations in parallel for better performance
    const [
      // Platform metrics
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      totalCustomers,
      totalRevenue,
      totalEvents30d,
      
      // MRR history
      mrrHistory,
      
      // Revenue by plan
      revenueByPlan,
      
      // Top organizations
      organizations
    ] = await Promise.all([
      // Platform metrics calculations
      prisma.organizations.count(),
      prisma.organizations.count({ where: { status: 'active' } }),
      prisma.users.count(),
      prisma.customers.count(),
      prisma.customers.aggregate({
        _sum: { mrr: true },
        where: { status: 'active' }
      }),
      prisma.alert_history.count({
        where: {
          triggered_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // MRR history (simplified version)
      this.generateMrrHistory(),
      
      // Revenue by plan
      this.generateRevenueByPlan(),
      
      // Top organizations with MRR and events
      this.getTopOrganizations()
    ]);

    const currentMRR = Number(totalRevenue._sum.mrr || 0);

    // Calculate changes (placeholders for now)
    const mrrChange = 12;
    const eventsChange = 15;
    const activeOrgsChange = 5;

    const analyticsData = {
      // Platform metrics
      metrics: {
        platformMRR: currentMRR,
        platformMRRChange: mrrChange,
        totalEvents30d: totalEvents30d,
        totalEventsChange: eventsChange,
        activeOrgs: activeOrganizations,
        activeOrgsChange: activeOrgsChange,
        apiUptime: 99.9,
        totalOrganizations,
        totalUsers,
        totalCustomers
      },
      
      // Charts data
      mrrHistory,
      revenueByPlan,
      
      // Top organizations
      topOrganizations: organizations
    };

    res.json(ApiResponse.success(analyticsData));
  });

  /**
   * @swagger
   * /admin/meters:
   *   get:
   *     summary: Get all meters across platform
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all meters
   */
  getMeters = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string | undefined)?.trim();
    const status = req.query.status as string | undefined;
    const eventType = req.query.event_type as string | undefined;
    const aggregation = req.query.aggregation as string | undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (status) where.status = status;
    if (eventType) where.event_type = eventType;
    if (aggregation) where.aggregation = aggregation;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { event_type: { contains: search, mode: 'insensitive' } },
        { field: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [meters, total] = await Promise.all([
      prisma.meters.findMany({
        where,
        include: {
          organizations: {
            select: { name: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.meters.count({ where })
    ]);

    res.json(ApiResponse.paginated(meters, page, limit, total));
  });

  /**
   * @swagger
   * /admin/pricing-models:
   *   get:
   *     summary: Get all pricing models across platform
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all pricing models
   */
  getPricingModels = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const pricingModels = await prisma.pricing_models.findMany({
      include: {
        organizations: {
          select: { name: true }
        },
        meters: {
          select: { name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(ApiResponse.success(pricingModels));
  });

  /**
   * @swagger
   * /admin/pricing-models:
   *   post:
   *     summary: Create a new pricing model (Admin)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - org_id
   *               - name
   *               - pricing_type
   *             properties:
   *               org_id:
   *                 type: string
   *                 description: Organization ID
   *               name:
   *                 type: string
   *                 description: Pricing model name
   *               pricing_type:
   *                 type: string
   *                 enum: [flat, tiered, volume, graduated]
   *                 description: Type of pricing
   *               meter_id:
   *                 type: string
   *                 description: Meter ID (optional)
   *               unit_price:
   *                 type: number
   *                 description: Unit price (optional)
   *               unit_label:
   *                 type: string
   *                 description: Unit label (optional)
   *               status:
   *                 type: string
   *                 enum: [active, draft, archived]
   *                 default: active
   *                 description: Status (optional)
   *     responses:
   *       201:
   *         description: Pricing model created successfully
   */
  createPricingModel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { org_id, ...pricingData } = req.body;

    // Verify organization exists
    const organization = await prisma.organizations.findUnique({
      where: { id: org_id }
    });

    if (!organization) {
      throw ApiError.badRequest('Invalid organization ID');
    }

    // Check for existing pricing model with same name in the organization
    const existingModel = await prisma.pricing_models.findFirst({
      where: {
        org_id: org_id,
        name: pricingData.name,
      },
    });

    if (existingModel) {
      throw ApiError.conflict('Pricing model with this name already exists in the organization');
    }

    // If meter_id is provided, verify it exists
    if (pricingData.meter_id) {
      const meter = await prisma.meters.findUnique({
        where: {
          id: pricingData.meter_id,
        },
      });

      if (!meter) {
        throw ApiError.badRequest('Invalid meter ID');
      }
    }

    const pricingModel = await prisma.pricing_models.create({
      data: {
        ...pricingData,
        org_id: org_id,
        status: pricingData.status || 'active',
      },
      include: {
        organizations: {
          select: {
            id: true,
            name: true
          }
        },
        meters: {
          select: {
            id: true,
            name: true,
            event_type: true
          }
        },
        pricing_tiers: {
          orderBy: {
            sort_order: 'asc',
          },
          select: {
            id: true,
            from_qty: true,
            to_qty: true,
            price_per_unit: true,
            sort_order: true
          }
        },
      },
    });

    // Return comprehensive response with real-time data
    const responseData = {
      ...pricingModel,
      created_at: pricingModel.created_at.toISOString(),
      // Add any computed fields for immediate display
      display_name: `${pricingModel.name} (${pricingModel.organizations?.name || 'Unknown Org'})`,
      meter_info: pricingModel.meters ? `${pricingModel.meters.name} (${pricingModel.meters.event_type})` : 'No meter',
      pricing_summary: pricingModel.pricing_type === 'flat' && pricingModel.unit_price
        ? `${pricingModel.unit_price} per ${pricingModel.unit_label || 'unit'}`
        : `${pricingModel.pricing_tiers?.length || 0} tiers`
    };

    res.status(201).json(ApiResponse.success(responseData, 'Pricing model created successfully'));
  });

  /**
   * @swagger
   * /admin/pricing-models/{id}:
   *   put:
   *     summary: Update a pricing model (Admin)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Pricing model ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Pricing model name
   *               pricing_type:
   *                 type: string
   *                 enum: [per_unit, tiered, volume, package]
   *                 description: Type of pricing
   *               meter_id:
   *                 type: string
   *                 description: Associated meter ID (optional)
   *               unit_price:
   *                 type: number
   *                 description: Unit price for flat pricing
   *               unit_label:
   *                 type: string
   *                 description: Unit label (e.g., "per token")
   *               status:
   *                 type: string
   *                 enum: [active, draft, archived]
   *                 description: Status of the pricing model
   *     responses:
   *       200:
   *         description: Pricing model updated successfully
   */
  updatePricingModel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { org_id, ...updateData } = req.body;

    // Check if pricing model exists
    const existingModel = await prisma.pricing_models.findUnique({
      where: { id },
    });

    if (!existingModel) {
      throw ApiError.notFound('Pricing model not found');
    }

    // If name is being updated, check for conflicts
    if (updateData.name && updateData.name !== existingModel.name) {
      const nameConflict = await prisma.pricing_models.findFirst({
        where: {
          name: updateData.name,
          org_id: existingModel.org_id,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw ApiError.conflict('Pricing model with this name already exists in the organization');
      }
    }

    // Validate meter if provided and not null/undefined
    if (updateData.meter_id !== undefined && updateData.meter_id !== null) {
      const meter = await prisma.meters.findUnique({
        where: { id: updateData.meter_id },
      });

      if (!meter) {
        throw ApiError.badRequest('Invalid meter ID');
      }
    }

    const updatePayload: any = {};

    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.pricing_type !== undefined) updatePayload.pricing_type = updateData.pricing_type;
    if (updateData.meter_id !== undefined) updatePayload.meter_id = updateData.meter_id;
    if (updateData.unit_price !== undefined) updatePayload.unit_price = updateData.unit_price;
    if (updateData.unit_label !== undefined) updatePayload.unit_label = updateData.unit_label;
    if (updateData.status !== undefined) updatePayload.status = updateData.status;

    const pricingModel = await prisma.pricing_models.update({
      where: { id },
      data: updatePayload,
      include: {
        organizations: {
          select: {
            id: true,
            name: true
          }
        },
        meters: {
          select: {
            id: true,
            name: true,
            event_type: true
          }
        },
        pricing_tiers: {
          orderBy: {
            sort_order: 'asc',
          },
          select: {
            id: true,
            from_qty: true,
            to_qty: true,
            price_per_unit: true,
            sort_order: true
          }
        },
      },
    });

    // Return comprehensive response with real-time data
    const responseData = {
      ...pricingModel,
      created_at: pricingModel.created_at.toISOString(),
      // Add any computed fields for immediate display
      display_name: `${pricingModel.name} (${pricingModel.organizations?.name || 'Unknown Org'})`,
      meter_info: pricingModel.meters ? `${pricingModel.meters.name} (${pricingModel.meters.event_type})` : 'No meter',
      pricing_summary: pricingModel.pricing_type === 'per_unit' && pricingModel.unit_price
        ? `${pricingModel.unit_price} per ${pricingModel.unit_label || 'unit'}`
        : `${pricingModel.pricing_tiers?.length || 0} tiers`
    };

    res.json(ApiResponse.success(responseData, 'Pricing model updated successfully'));
  });

  /**
   * @swagger
   * /admin/mrr-history:
   *   get:
   *     summary: Get MRR history
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: MRR history data
   */
  getMrrHistory = asyncHandler(async (_req: AuthRequest, res: Response) => {
    // Generate last 12 months of MRR data based on current active customers
    // Note: This is a simplified version. In production, you'd want historical snapshots
    const mrrHistory = [];
    const now = new Date();

    // Get current total MRR
    const currentMrrResult = await prisma.customers.aggregate({
      _sum: { mrr: true },
      where: { status: 'active' }
    });
    const currentMRR = Number(currentMrrResult._sum.mrr || 0);

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      // For now, use current MRR as placeholder for historical data
      // In production, you'd query historical data or snapshots
      mrrHistory.push({
        month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        mrr: Math.round(currentMRR * (0.8 + Math.random() * 0.4)) // Add some variation
      });
    }

    res.json(ApiResponse.success(mrrHistory));
  });

  /**
   * @swagger
   * /admin/revenue-by-plan:
   *   get:
   *     summary: Get revenue breakdown by plan
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Revenue by plan data
   */
  getRevenueByPlan = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const revenueByPlan = await prisma.customers.groupBy({
      by: ['product_id'],
      _sum: {
        mrr: true
      },
      _count: {
        id: true
      },
      where: {
        status: 'active'
      }
    });

    // Get product names and format data
    const formattedData = await Promise.all(
      revenueByPlan.map(async (item) => {
        const product = item.product_id ? await prisma.products.findUnique({
          where: { id: item.product_id },
          select: { name: true }
        }) : null;

        return {
          name: product?.name || 'No Plan',
          value: item._sum.mrr || 0,
          count: item._count.id,
          color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
        };
      })
    );

    res.json(ApiResponse.success(formattedData));
  });

  /**
   * @swagger
   * /admin/matrix-pricing:
   *   get:
   *     summary: Get matrix pricing data
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Matrix pricing data
   */
  getMatrixPricing = asyncHandler(async (_req: AuthRequest, res: Response) => {
    // Return sample matrix pricing data for AI models
    const matrixPricing = [
      {
        id: 'gpt-4',
        model: 'GPT-4',
        input: 0.03,
        output: 0.06,
        cached: 0.015,
        color: '#10B981'
      },
      {
        id: 'gpt-3.5-turbo',
        model: 'GPT-3.5 Turbo',
        input: 0.0015,
        output: 0.002,
        cached: 0.00075,
        color: '#3B82F6'
      },
      {
        id: 'claude-3',
        model: 'Claude 3',
        input: 0.015,
        output: 0.075,
        cached: 0.0075,
        color: '#F59E0B'
      },
      {
        id: 'gemini-pro',
        model: 'Gemini Pro',
        input: 0.0005,
        output: 0.0015,
        cached: 0.00025,
        color: '#EF4444'
      }
    ];

    res.json(ApiResponse.success(matrixPricing));
  });

  // Helper methods for analytics
  private async generateMrrHistory() {
    // Generate last 12 months of MRR data based on current active customers
    const mrrHistory = [];
    const now = new Date();

    // Get current total MRR
    const currentMrrResult = await prisma.customers.aggregate({
      _sum: { mrr: true },
      where: { status: 'active' }
    });
    const currentMRR = Number(currentMrrResult._sum.mrr || 0);

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      // For now, use current MRR as placeholder for historical data
      // In production, you'd query historical data or snapshots
      mrrHistory.push({
        month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        mrr: Math.round(currentMRR * (0.8 + Math.random() * 0.4)) // Add some variation
      });
    }

    return mrrHistory;
  }

  private async generateRevenueByPlan() {
    const revenueByPlan = await prisma.customers.groupBy({
      by: ['product_id'],
      _sum: {
        mrr: true
      },
      _count: {
        id: true
      },
      where: {
        status: 'active'
      }
    });

    // Get product names and format data
    const formattedData = await Promise.all(
      revenueByPlan.map(async (item) => {
        const product = item.product_id ? await prisma.products.findUnique({
          where: { id: item.product_id },
          select: { name: true }
        }) : null;

        return {
          name: product?.name || 'No Plan',
          value: item._sum.mrr || 0,
          count: item._count.id,
          color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
        };
      })
    );

    return formattedData;
  }

  private async getTopOrganizations() {
    // Get top 3 organizations by MRR
    const organizations = await prisma.organizations.findMany({
      take: 3,
      orderBy: { created_at: 'desc' }, // We'll sort by MRR after calculation
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
    });

    // Get MRR sums for these organizations
    const orgIds = organizations.map(org => org.id);
    const mrrSums = await prisma.customers.groupBy({
      by: ['org_id'],
      where: {
        org_id: { in: orgIds },
        status: 'active',
      },
      _sum: {
        mrr: true,
      },
    });

    // Get events count for last 30 days per organization
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const eventsCounts = await prisma.usage_events.groupBy({
      by: ['org_id'],
      where: {
        org_id: { in: orgIds },
        created_at: { gte: thirtyDaysAgo }
      },
      _count: {
        id: true,
      },
    });

    // Create maps
    const mrrMap = new Map<string, number>();
    mrrSums.forEach(sum => {
      mrrMap.set(sum.org_id, Number(sum._sum.mrr) || 0);
    });

    const eventsMap = new Map<string, number>();
    eventsCounts.forEach(count => {
      eventsMap.set(count.org_id, count._count.id);
    });

    // Transform and sort by MRR
    const transformedOrganizations = organizations
      .map(org => ({
        id: org.id,
        name: org.name,
        mrr: mrrMap.get(org.id) || 0,
        totalEvents: eventsMap.get(org.id) || 0,
        customers: org._count.customers,
        growth: 0, // Placeholder
      }))
      .sort((a, b) => b.mrr - a.mrr); // Sort by MRR descending

    return transformedOrganizations;
  }
}

export default new AdminController();
