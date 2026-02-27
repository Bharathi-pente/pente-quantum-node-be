import { PrismaClient } from '@prisma/client';
import { Webhook, WebhookLog, WebhookEvent, IWebhookRepository, IWebhookLogRepository, IWebhookEventRepository } from '../interfaces/IWebhookRepository';

const prisma = new PrismaClient();

export class WebhookRepository implements IWebhookRepository {
  async create(data: Partial<Webhook>): Promise<Webhook> {
    return await prisma.webhooks.create({
      data: {
        org_id: data.org_id!,
        name: data.name!,
        url: data.url!,
        subscribed_events: data.subscribed_events || [],
        status: data.status || 'active',
      },
    });
  }

  async findAll(orgId: string, page = 1, limit = 10, filters?: any): Promise<{ webhooks: Webhook[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = { org_id: orgId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    const [webhooks, total] = await Promise.all([
      prisma.webhooks.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.webhooks.count({ where }),
    ]);

    return { webhooks, total };
  }

  async findById(id: string): Promise<Webhook | null> {
    return await prisma.webhooks.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Partial<Webhook>): Promise<Webhook> {
    return await prisma.webhooks.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.webhooks.delete({
      where: { id },
    });
  }

  async findActiveByOrgId(orgId: string): Promise<Webhook[]> {
    return await prisma.webhooks.findMany({
      where: {
        org_id: orgId,
        status: 'active',
      },
    });
  }
}

export class WebhookLogRepository implements IWebhookLogRepository {
  async create(data: Partial<WebhookLog>): Promise<WebhookLog> {
    const dbLog = await prisma.webhook_logs.create({
      data: {
        webhook_id: data.webhookId!,
        event_type: data.event!,
        delivery_status: data.status || 'pending',
        response_code: data.responseCode,
        response_time_ms: data.responseTime,
        payload: data.payload,
        error_message: data.error,
        retry_count: data.retryCount || 0,
      },
    });

    return this.transformFromDb(dbLog);
  }

  async findAll(webhookId?: string, page = 1, limit = 10, filters?: any): Promise<{ logs: WebhookLog[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (webhookId) {
      where.webhook_id = webhookId;
    }
    if (filters?.event) {
      where.event_type = filters.event;
    }
    if (filters?.status) {
      where.delivery_status = filters.status;
    }

    const [dbLogs, total] = await Promise.all([
      prisma.webhook_logs.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          webhooks: {
            select: {
              name: true,
              url: true,
            },
          },
        },
      }),
      prisma.webhook_logs.count({ where }),
    ]);

    const logs = dbLogs.map(log => this.transformFromDb(log));

    return { logs, total };
  }

  private transformFromDb(dbLog: any): WebhookLog {
    return {
      id: dbLog.id,
      webhookId: dbLog.webhook_id,
      event: dbLog.event_type,
      status: dbLog.delivery_status,
      responseCode: dbLog.response_code,
      responseTime: dbLog.response_time_ms,
      timestamp: dbLog.created_at.toISOString().slice(0, 19).replace('T', ' '),
      payload: dbLog.payload,
      error: dbLog.error_message,
      retryCount: dbLog.retry_count,
    };
  }

  async getStatsForOrg(orgId: string): Promise<{
    events24h: number;
    successRate: number;
    avgResponseTime: number;
  }> {
    // Get date 24 hours ago
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    // Get webhooks for this org
    const webhooks = await prisma.webhooks.findMany({
      where: { org_id: orgId },
      select: { id: true },
    });

    const webhookIds = webhooks.map(w => w.id);

    if (webhookIds.length === 0) {
      return {
        events24h: 0,
        successRate: 0,
        avgResponseTime: 0,
      };
    }

    // Count events in last 24h
    const events24h = await prisma.webhook_logs.count({
      where: {
        webhook_id: { in: webhookIds },
        created_at: { gte: yesterday },
      },
    });

    // Get all logs for success rate and avg response time
    const allLogs = await prisma.webhook_logs.findMany({
      where: {
        webhook_id: { in: webhookIds },
      },
      select: {
        delivery_status: true,
        response_time_ms: true,
      },
    });

    // Calculate success rate
    let successRate = 0;
    if (allLogs.length > 0) {
      const successCount = allLogs.filter(
        log => log.delivery_status === 'success'
      ).length;
      successRate = (successCount / allLogs.length) * 100;
    }

    // Calculate average response time
    let avgResponseTime = 0;
    const logsWithResponseTime = allLogs.filter(
      log => log.response_time_ms !== null && log.response_time_ms !== undefined
    );
    if (logsWithResponseTime.length > 0) {
      const totalResponseTime = logsWithResponseTime.reduce(
        (sum, log) => sum + (log.response_time_ms || 0),
        0
      );
      avgResponseTime = totalResponseTime / logsWithResponseTime.length;
    }

    return {
      events24h,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      avgResponseTime: Math.round(avgResponseTime), // Round to nearest ms
    };
  }
}

export class WebhookEventRepository implements IWebhookEventRepository {
  async getAvailableEvents(): Promise<WebhookEvent[]> {
    // Return predefined webhook events
    return [
      {
        event_type: 'invoice.created',
        data: { description: 'Triggered when a new invoice is created' },
        timestamp: new Date(),
      },
      {
        event_type: 'invoice.updated',
        data: { description: 'Triggered when an invoice is updated' },
        timestamp: new Date(),
      },
      {
        event_type: 'invoice.paid',
        data: { description: 'Triggered when an invoice is paid' },
        timestamp: new Date(),
      },
      {
        event_type: 'customer.created',
        data: { description: 'Triggered when a new customer is created' },
        timestamp: new Date(),
      },
      {
        event_type: 'customer.updated',
        data: { description: 'Triggered when a customer is updated' },
        timestamp: new Date(),
      },
      {
        event_type: 'payment.succeeded',
        data: { description: 'Triggered when a payment succeeds' },
        timestamp: new Date(),
      },
      {
        event_type: 'payment.failed',
        data: { description: 'Triggered when a payment fails' },
        timestamp: new Date(),
      },
      {
        event_type: 'usage.threshold_exceeded',
        data: { description: 'Triggered when usage exceeds threshold' },
        timestamp: new Date(),
      },
    ];
  }
}