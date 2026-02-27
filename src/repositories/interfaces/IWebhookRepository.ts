import { Webhook, WebhookLog, WebhookEvent } from '../../types';

export { Webhook, WebhookLog, WebhookEvent };

export interface IWebhookRepository {
  create(data: Partial<Webhook>): Promise<Webhook>;
  findAll(orgId: string, page?: number, limit?: number, filters?: any): Promise<{ webhooks: Webhook[]; total: number }>;
  findById(id: string): Promise<Webhook | null>;
  update(id: string, data: Partial<Webhook>): Promise<Webhook>;
  delete(id: string): Promise<void>;
  findActiveByOrgId(orgId: string): Promise<Webhook[]>;
}

export interface IWebhookLogRepository {
  create(data: Partial<WebhookLog>): Promise<WebhookLog>;
  findAll(webhookId?: string, page?: number, limit?: number, filters?: any): Promise<{ logs: WebhookLog[]; total: number }>;
  getStatsForOrg(orgId: string): Promise<{
    events24h: number;
    successRate: number;
    avgResponseTime: number;
  }>;
}

export interface IWebhookEventRepository {
  getAvailableEvents(): Promise<WebhookEvent[]>;
}