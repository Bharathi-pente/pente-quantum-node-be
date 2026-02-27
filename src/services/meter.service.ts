import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class MeterService {
  async create(data: any, orgId: string) {
    const existingMeter = await prisma.meters.findFirst({
      where: {
        org_id: orgId,
        name: data.name,
      },
    });

    if (existingMeter) {
      throw ApiError.conflict('Meter with this name already exists in your organization');
    }

    try {
      return await prisma.meters.create({
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

  async findAll(orgId: string | undefined, page = 1, limit = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Only filter by org_id if orgId is provided (not admin)
    if (orgId) {
      where.org_id = orgId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.event_type) {
      where.event_type = filters.event_type;
    }
    if (filters?.aggregation) {
      where.aggregation = filters.aggregation;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { event_type: { contains: filters.search, mode: 'insensitive' } },
        { field: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [meters, total] = await Promise.all([
      prisma.meters.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.meters.count({ where }),
    ]);

    return { meters, total, page, limit };
  }

  async findById(id: string, orgId: string) {
    const meter = await prisma.meters.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!meter) {
      throw ApiError.notFound('Meter not found');
    }

    return meter;
  }

  async update(id: string, data: any, orgId: string) {
    // Check if meter exists and belongs to org
    await this.findById(id, orgId);

    // Check for name conflict if name is being updated
    if (data.name) {
      const existingMeter = await prisma.meters.findFirst({
        where: {
          org_id: orgId,
          name: data.name,
          id: { not: id },
        },
      });

      if (existingMeter) {
        throw ApiError.conflict('Meter with this name already exists in your organization');
      }
    }

    try {
      return await prisma.meters.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw ApiError.notFound('Meter not found');
      }
      throw error;
    }
  }

  async delete(id: string, orgId: string) {
    // Check if meter exists and belongs to org
    await this.findById(id, orgId);

    try {
      await prisma.meters.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw ApiError.notFound('Meter not found');
      }
      throw error;
    }
  }

  // Real-time meter data methods
  async getRealtimeReadings(meterId: string, orgId: string, timeframe: string = '24h', granularity: string = 'hour') {
    // Verify meter exists and belongs to org
    const meter = await prisma.meters.findFirst({
      where: {
        id: meterId,
        org_id: orgId,
      },
    });

    if (!meter) {
      throw ApiError.notFound('Meter not found');
    }

    // Calculate timeframe
    const now = new Date();
    let startTime: Date;

    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Generate simulated readings based on granularity
    const readings = [];
    let currentTime = new Date(startTime);
    let totalValue = 0;
    let maxValue = 0;

    while (currentTime <= now) {
      const value = Math.floor(Math.random() * 100) + 10; // Random value between 10-110
      const count = Math.floor(Math.random() * 50) + 1; // Random count between 1-50

      readings.push({
        timestamp: currentTime.toISOString(),
        value,
        count,
      });

      totalValue += value;
      maxValue = Math.max(maxValue, value);

      // Increment based on granularity
      switch (granularity) {
        case 'minute':
          currentTime = new Date(currentTime.getTime() + 60 * 1000);
          break;
        case 'hour':
          currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
          break;
        case 'day':
          currentTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
          break;
        default:
          currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
      }
    }

    return {
      meter_id: meterId,
      readings,
      total_value: totalValue,
      average_value: readings.length > 0 ? totalValue / readings.length : 0,
      peak_value: maxValue,
      timeframe,
      granularity,
    };
  }

  async getRealtimeStats(orgId: string, eventType?: string, timeframe: string = '24h') {
    // Get all meters for the organization
    const where: any = { org_id: orgId };
    if (eventType) {
      where.event_type = eventType;
    }

    const meters = await prisma.meters.findMany({
      where,
      select: {
        id: true,
        event_type: true,
        status: true,
      },
    });

    // Calculate timeframe
    const now = new Date();
    let startTime: Date;

    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Simulate statistics
    const totalMeters = meters.length;
    const activeMeters = meters.filter(m => m.status === 'active').length;
    const totalEvents = Math.floor(Math.random() * 10000) + 1000;
    const eventsPerMinute = Math.floor(totalEvents / ((now.getTime() - startTime.getTime()) / (1000 * 60)));

    // Group by event type
    const eventTypeCounts: { [key: string]: number } = {};
    meters.forEach(meter => {
      eventTypeCounts[meter.event_type] = (eventTypeCounts[meter.event_type] || 0) + Math.floor(Math.random() * 100) + 1;
    });

    const topEventTypes = Object.entries(eventTypeCounts)
      .map(([event_type, count]) => ({
        event_type,
        count,
        percentage: Math.round((count / totalEvents) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total_meters: totalMeters,
      active_meters: activeMeters,
      total_events: totalEvents,
      events_per_minute: eventsPerMinute,
      top_event_types: topEventTypes,
      timeframe,
    };
  }

  async getRealtimeEvents(meterId: string, orgId: string, limit: number = 50, since?: string) {
    // Verify meter exists and belongs to org
    const meter = await prisma.meters.findFirst({
      where: {
        id: meterId,
        org_id: orgId,
      },
    });

    if (!meter) {
      throw ApiError.notFound('Meter not found');
    }

    // Generate simulated events
    const events = [];
    const startTime = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (let i = 0; i < Math.min(limit, 100); i++) {
      const timestamp = new Date(startTime.getTime() + Math.random() * (Date.now() - startTime.getTime()));
      events.push({
        id: `event-${i + 1}`,
        timestamp: timestamp.toISOString(),
        event_type: meter.event_type,
        value: Math.floor(Math.random() * 1000) + 1,
        customer_id: `customer-${Math.floor(Math.random() * 100) + 1}`,
        metadata: {
          source: 'simulated',
          version: '1.0',
          tags: ['realtime', 'meter'],
        },
      });
    }

    // Sort by timestamp descending (most recent first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      meter_id: meterId,
      events,
      total_events: events.length,
      since: since || startTime.toISOString(),
    };
  }

  async getPerformanceMetrics(meterId: string, orgId: string, timeframe: string = '24h') {
    // Verify meter exists and belongs to org
    const meter = await prisma.meters.findFirst({
      where: {
        id: meterId,
        org_id: orgId,
      },
    });

    if (!meter) {
      throw ApiError.notFound('Meter not found');
    }

    // Simulate performance metrics
    const totalEvents = Math.floor(Math.random() * 10000) + 1000;
    const timeInMs = this.getTimeframeInMs(timeframe);

    return {
      meter_id: meterId,
      throughput: {
        events_per_second: Math.round((totalEvents / timeInMs) * 1000 * 100) / 100,
        events_per_minute: Math.round((totalEvents / timeInMs) * 1000 * 60 * 100) / 100,
        events_per_hour: Math.round((totalEvents / timeInMs) * 1000 * 3600 * 100) / 100,
      },
      latency: {
        average_ms: Math.floor(Math.random() * 100) + 10,
        p95_ms: Math.floor(Math.random() * 200) + 50,
        p99_ms: Math.floor(Math.random() * 500) + 100,
      },
      reliability: {
        success_rate: Math.round((95 + Math.random() * 5) * 100) / 100,
        error_rate: Math.round((Math.random() * 5) * 100) / 100,
        uptime_percentage: Math.round((99 + Math.random() * 1) * 100) / 100,
      },
      timeframe,
    };
  }

  async getHealthMonitoring(orgId: string, status?: string, eventType?: string) {
    // Get all meters for the organization
    const where: any = { org_id: orgId };
    if (eventType) {
      where.event_type = eventType;
    }

    const meters = await prisma.meters.findMany({
      where,
      select: {
        id: true,
        name: true,
        event_type: true,
        status: true,
      },
    });

    // Simulate health data for each meter
    const meterHealthData = meters.map(meter => {
      const eventsLastHour = Math.floor(Math.random() * 1000);
      const errorRate = Math.random() * 0.1; // 0-10% error rate
      const lastEventTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);

      let healthStatus = 'healthy';
      if (errorRate > 0.05) {
        healthStatus = 'warning';
      }
      if (errorRate > 0.08 || eventsLastHour < 10) {
        healthStatus = 'critical';
      }
      if (eventsLastHour === 0 && Math.random() > 0.8) {
        healthStatus = 'offline';
      }

      // Filter by status if provided
      if (status && healthStatus !== status) {
        return null;
      }

      return {
        id: meter.id,
        name: meter.name,
        status: healthStatus,
        last_event: lastEventTime.toISOString(),
        events_last_hour: eventsLastHour,
        error_rate: Math.round(errorRate * 10000) / 100,
      };
    }).filter(Boolean);

    // Calculate overall health
    const healthyMeters = meterHealthData.filter(m => m!.status === 'healthy').length;
    const warningMeters = meterHealthData.filter(m => m!.status === 'warning').length;
    const criticalMeters = meterHealthData.filter(m => m!.status === 'critical').length;
    const offlineMeters = meterHealthData.filter(m => m!.status === 'offline').length;
    const totalMeters = meterHealthData.length;

    const healthScore = totalMeters > 0
      ? Math.round(((healthyMeters * 1 + warningMeters * 0.5) / totalMeters) * 100 * 100) / 100
      : 0;

    return {
      overall_health: {
        healthy_meters: healthyMeters,
        warning_meters: warningMeters,
        critical_meters: criticalMeters,
        offline_meters: offlineMeters,
        health_score: healthScore,
      },
      meters: meterHealthData,
      total_meters: totalMeters,
    };
  }

  private getTimeframeInMs(timeframe: string): number {
    switch (timeframe) {
      case '1h':
        return 60 * 60 * 1000;
      case '24h':
        return 24 * 60 * 60 * 1000;
      case '7d':
        return 7 * 24 * 60 * 60 * 1000;
      case '30d':
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }
}

export default new MeterService();