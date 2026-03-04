import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface UsageAggregationFilters {
  customer_id?: string;
  meter_id?: string;
  event_type?: string;
  start_date?: Date;
  end_date?: Date;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  group_by?: string[];
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export interface UsageStatsFilters {
  customer_id?: string;
  meter_id?: string;
  event_type?: string;
  start_date?: Date;
  end_date?: Date;
  period?: 'hour' | 'day' | 'week' | 'month' | 'year';
}

export class UsageService {
  /**
   * Create a single usage event
   */
  async createUsageEvent(orgId: string, data: {
    customer_id?: string;
    meter_id: string;
    event_type: string;
    event_value: number;
    event_time?: Date;
    metadata?: any;
    source?: string;
  }) {
    // Verify meter belongs to organization
    const meter = await prisma.meters.findFirst({
      where: {
        id: data.meter_id,
        org_id: orgId,
      },
    });

    if (!meter) {
      throw new Error('Meter not found or does not belong to this organization');
    }

    // If customer_id is provided, verify it belongs to the organization
    if (data.customer_id) {
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
        throw new Error('Customer not found or does not belong to this organization');
      }
    }

    return await prisma.usage_events.create({
      data: {
        org_id: orgId,
        customer_id: data.customer_id,
        meter_id: data.meter_id,
        event_type: data.event_type,
        event_value: new Decimal(data.event_value),
        event_time: data.event_time || new Date(),
        metadata: data.metadata || {},
        source: data.source,
      },
    });
  }

  /**
   * Bulk create usage events
   */
  async bulkCreateUsageEvents(orgId: string, events: Array<{
    customer_id?: string;
    meter_id: string;
    event_type: string;
    event_value: number;
    event_time?: Date;
    metadata?: any;
    source?: string;
  }>) {
    // Validate all meters and customers belong to the organization
    const meterIds = [...new Set(events.map(e => e.meter_id))];
    const customerIds = [...new Set(events.map(e => e.customer_id).filter(Boolean))];

    const meters = await prisma.meters.findMany({
      where: {
        id: { in: meterIds },
        org_id: orgId,
      },
    });

    if (meters.length !== meterIds.length) {
      throw new Error('One or more meters not found or do not belong to this organization');
    }

    if (customerIds.length > 0) {
      const customers = await prisma.customers.findMany({
        where: {
          id: { in: customerIds as string[] },
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

      if (customers.length !== customerIds.length) {
        throw new Error('One or more customers not found or do not belong to this organization');
      }
    }

    const usageEvents = events.map(event => ({
      org_id: orgId,
      customer_id: event.customer_id,
      meter_id: event.meter_id,
      event_type: event.event_type,
      event_value: new Decimal(event.event_value),
      event_time: event.event_time || new Date(),
      metadata: event.metadata || {},
      source: event.source,
    }));

    return await prisma.usage_events.createMany({
      data: usageEvents,
      skipDuplicates: false,
    });
  }

  /**
   * Get usage events with filtering and pagination
   */
  async getUsageEvents(orgId: string, filters: {
    customer_id?: string;
    meter_id?: string;
    event_type?: string;
    start_date?: Date;
    end_date?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      org_id: orgId,
    };

    if (filters.customer_id) where.customer_id = filters.customer_id;
    if (filters.meter_id) where.meter_id = filters.meter_id;
    if (filters.event_type) where.event_type = filters.event_type;

    if (filters.start_date || filters.end_date) {
      where.event_time = {};
      if (filters.start_date) where.event_time.gte = filters.start_date;
      if (filters.end_date) where.event_time.lte = filters.end_date;
    }

    const [events, total] = await Promise.all([
      prisma.usage_events.findMany({
        where,
        include: {
          customers: {
            select: { id: true, name: true, email: true },
          },
          meters: {
            select: { id: true, name: true, event_type: true },
          },
        },
        orderBy: { event_time: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
      prisma.usage_events.count({ where }),
    ]);

    return {
      events,
      total,
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    };
  }

  /**
   * Get a single usage event by ID
   */
  async getUsageEventById(orgId: string, eventId: string) {
    const event = await prisma.usage_events.findFirst({
      where: {
        id: eventId,
        org_id: orgId,
      },
      include: {
        customers: {
          select: { id: true, name: true, email: true },
        },
        meters: {
          select: { id: true, name: true, event_type: true },
        },
      },
    });

    if (!event) {
      throw new Error('Usage event not found');
    }

    return event;
  }

  /**
   * Aggregate usage data with flexible grouping and time periods
   */
  async getUsageAggregation(orgId: string, filters: UsageAggregationFilters) {
    const {
      customer_id,
      meter_id,
      event_type,
      start_date,
      end_date,
      granularity = 'day',
      group_by = ['day'],
      aggregation = 'sum',
    } = filters;

    let dateTrunc: string;
    switch (granularity) {
      case 'hour':
        dateTrunc = 'hour';
        break;
      case 'day':
        dateTrunc = 'day';
        break;
      case 'week':
        dateTrunc = 'week';
        break;
      case 'month':
        dateTrunc = 'month';
        break;
      default:
        dateTrunc = 'day';
    }

    // Build the SELECT clause
    const selectFields: string[] = [];
    const groupByFields: string[] = [];

    group_by.forEach(field => {
      switch (field) {
        case 'customer_id':
          selectFields.push('customer_id');
          groupByFields.push('customer_id');
          break;
        case 'meter_id':
          selectFields.push('meter_id');
          groupByFields.push('meter_id');
          break;
        case 'event_type':
          selectFields.push('event_type');
          groupByFields.push('event_type');
          break;
        case 'day':
        case 'week':
        case 'month':
          selectFields.push(`DATE_TRUNC('${dateTrunc}', event_time) as period`);
          groupByFields.push(`DATE_TRUNC('${dateTrunc}', event_time)`);
          break;
      }
    });

    // Add aggregation function
    let aggFunction: string;
    switch (aggregation) {
      case 'sum':
        aggFunction = 'SUM(event_value)';
        break;
      case 'avg':
        aggFunction = 'AVG(event_value)';
        break;
      case 'min':
        aggFunction = 'MIN(event_value)';
        break;
      case 'max':
        aggFunction = 'MAX(event_value)';
        break;
      case 'count':
        aggFunction = 'COUNT(*)';
        break;
      default:
        aggFunction = 'SUM(event_value)';
    }

    selectFields.push(`${aggFunction} as aggregated_value`);

    // Build WHERE clause
    const whereConditions: string[] = ['org_id = $1'];
    const queryParams: any[] = [orgId];

    if (customer_id) {
      whereConditions.push(`customer_id = $${queryParams.length + 1}`);
      queryParams.push(customer_id);
    }

    if (meter_id) {
      whereConditions.push(`meter_id = $${queryParams.length + 1}`);
      queryParams.push(meter_id);
    }

    if (event_type) {
      whereConditions.push(`event_type = $${queryParams.length + 1}`);
      queryParams.push(event_type);
    }

    if (start_date) {
      whereConditions.push(`event_time >= $${queryParams.length + 1}`);
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`event_time <= $${queryParams.length + 1}`);
      queryParams.push(end_date);
    }

    const query = `
      SELECT ${selectFields.join(', ')}
      FROM usage_events
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY ${groupByFields.join(', ')}
      ORDER BY ${groupByFields[0]}
    `;

    const result = await prisma.$queryRawUnsafe(query, ...queryParams);

    return result;
  }

  /**
   * Get usage statistics and insights
   */
  async getUsageStats(orgId: string, filters: UsageStatsFilters) {
    const {
      customer_id,
      meter_id,
      event_type,
      start_date,
      end_date,
      period = 'month',
    } = filters;

    // Calculate date range if not provided
    const now = new Date();
    const periodStart = start_date || this.getPeriodStart(now, period);
    const periodEnd = end_date || now;

    // Get total events and volume
    const whereConditions: any = {
      org_id: orgId,
      event_time: {
        gte: periodStart,
        lte: periodEnd,
      },
    };

    if (customer_id) whereConditions.customer_id = customer_id;
    if (meter_id) whereConditions.meter_id = meter_id;
    if (event_type) whereConditions.event_type = event_type;

    const [totalEvents, totalVolume, eventTypeBreakdown, customerBreakdown, meterBreakdown] = await Promise.all([
      // Total events count
      prisma.usage_events.count({ where: whereConditions }),

      // Total volume
      prisma.usage_events.aggregate({
        where: whereConditions,
        _sum: { event_value: true },
      }),

      // Breakdown by event type
      prisma.usage_events.groupBy({
        by: ['event_type'],
        where: whereConditions,
        _sum: { event_value: true },
        _count: true,
        orderBy: { _sum: { event_value: 'desc' } },
        take: 10,
      }),

      // Breakdown by customer
      prisma.usage_events.groupBy({
        by: ['customer_id'],
        where: { ...whereConditions, customer_id: { not: null } },
        _sum: { event_value: true },
        _count: true,
        orderBy: { _sum: { event_value: 'desc' } },
        take: 10,
      }),

      // Breakdown by meter
      prisma.usage_events.groupBy({
        by: ['meter_id'],
        where: whereConditions,
        _sum: { event_value: true },
        _count: true,
        orderBy: { _sum: { event_value: 'desc' } },
        take: 10,
      }),
    ]);

    // Get customer and meter names for the breakdowns
    const customerIds = customerBreakdown.map(cb => cb.customer_id).filter(Boolean);
    const meterIds = meterBreakdown.map(mb => mb.meter_id);

    const [customers, meters] = await Promise.all([
      customerIds.length > 0 ? prisma.customers.findMany({
        where: { id: { in: customerIds as string[] } },
        select: { id: true, name: true },
      }) : Promise.resolve([]),

      meterIds.length > 0 ? prisma.meters.findMany({
        where: { id: { in: meterIds } },
        select: { id: true, name: true },
      }) : Promise.resolve([]),
    ]);

    const customerMap = new Map(customers.map(c => [c.id, c.name]));
    const meterMap = new Map(meters.map(m => [m.id, m.name]));

    return {
      period: {
        start: periodStart,
        end: periodEnd,
        granularity: period,
      },
      summary: {
        total_events: totalEvents,
        total_volume: totalVolume._sum.event_value?.toNumber() || 0,
        average_event_value: totalEvents > 0 ? (totalVolume._sum.event_value?.toNumber() || 0) / totalEvents : 0,
      },
      breakdowns: {
        by_event_type: eventTypeBreakdown.map(et => ({
          event_type: et.event_type,
          event_count: et._count,
          total_value: et._sum.event_value?.toNumber() || 0,
        })),
        by_customer: customerBreakdown.map(cb => ({
          customer_id: cb.customer_id,
          customer_name: customerMap.get(cb.customer_id!) || 'Unknown',
          event_count: cb._count,
          total_value: cb._sum.event_value?.toNumber() || 0,
        })),
        by_meter: meterBreakdown.map(mb => ({
          meter_id: mb.meter_id,
          meter_name: meterMap.get(mb.meter_id) || 'Unknown',
          event_count: mb._count,
          total_value: mb._sum.event_value?.toNumber() || 0,
        })),
      },
    };
  }

  /**
   * Get usage trends over time
   */
  async getUsageTrends(orgId: string, filters: {
    customer_id?: string;
    meter_id?: string;
    event_type?: string;
    start_date: Date;
    end_date: Date;
    granularity: 'hour' | 'day' | 'week' | 'month';
  }) {
    const { customer_id, meter_id, event_type, start_date, end_date, granularity } = filters;

    let dateTrunc: string;
    switch (granularity) {
      case 'hour':
        dateTrunc = 'hour';
        break;
      case 'day':
        dateTrunc = 'day';
        break;
      case 'week':
        dateTrunc = 'week';
        break;
      case 'month':
        dateTrunc = 'month';
        break;
    }

    const whereConditions: string[] = ['org_id = $1'];
    const queryParams: any[] = [orgId];

    if (customer_id) {
      whereConditions.push(`customer_id = $${queryParams.length + 1}`);
      queryParams.push(customer_id);
    }

    if (meter_id) {
      whereConditions.push(`meter_id = $${queryParams.length + 1}`);
      queryParams.push(meter_id);
    }

    if (event_type) {
      whereConditions.push(`event_type = $${queryParams.length + 1}`);
      queryParams.push(event_type);
    }

    whereConditions.push(`event_time >= $${queryParams.length + 1}`);
    queryParams.push(start_date);

    whereConditions.push(`event_time <= $${queryParams.length + 1}`);
    queryParams.push(end_date);

    const query = `
      SELECT
        DATE_TRUNC('${dateTrunc}', event_time) as period,
        COUNT(*) as event_count,
        SUM(event_value) as total_value,
        AVG(event_value) as avg_value,
        MIN(event_value) as min_value,
        MAX(event_value) as max_value
      FROM usage_events
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY DATE_TRUNC('${dateTrunc}', event_time)
      ORDER BY period
    `;

    const result = await prisma.$queryRawUnsafe(query, ...queryParams);

    return result;
  }

  /**
   * Helper method to get period start date
   */
  private getPeriodStart(now: Date, period: string): Date {
    const start = new Date(now);

    switch (period) {
      case 'hour':
        start.setHours(now.getHours() - 1);
        break;
      case 'day':
        start.setDate(now.getDate() - 1);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }

    return start;
  }
}

export default new UsageService();