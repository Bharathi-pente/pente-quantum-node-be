import { Webhook, WebhookLog } from '../types';
import { webhookRepository, webhookLogRepository, webhookEventRepository } from '../repositories';
import ApiError from '../utils/ApiError';

export class WebhookService {
  async create(data: Partial<Webhook>) {
    try {
      // Validate URL format
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(data.url!)) {
        throw ApiError.badRequest('Invalid URL format');
      }

      return await webhookRepository.create(data);
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw ApiError.badRequest('Invalid organization ID');
      }
      if (error.code === 'P2002') {
        throw ApiError.conflict('Webhook with this name already exists in your organization');
      }
      throw error;
    }
  }

  async findAll(orgId: string, page = 1, limit = 10, filters?: any) {
    return await webhookRepository.findAll(orgId, page, limit, filters);
  }

  async findById(id: string) {
    const webhook = await webhookRepository.findById(id);
    if (!webhook) {
      throw ApiError.notFound('Webhook not found');
    }
    return webhook;
  }

  async update(id: string, data: Partial<Webhook>) {
    // Check if webhook exists
    await this.findById(id);

    // Validate URL if provided
    if (data.url) {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(data.url)) {
        throw ApiError.badRequest('Invalid URL format');
      }
    }

    try {
      return await webhookRepository.update(id, data);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw ApiError.conflict('Webhook with this name already exists in your organization');
      }
      throw error;
    }
  }

  async delete(id: string) {
    // Check if webhook exists
    await this.findById(id);

    return await webhookRepository.delete(id);
  }

  async getActiveWebhooks(orgId: string) {
    return await webhookRepository.findActiveByOrgId(orgId);
  }
}

export class WebhookLogService {
  async create(data: Partial<WebhookLog>) {
    return await webhookLogRepository.create(data);
  }

  async findAll(webhookId?: string, page = 1, limit = 10, filters?: any) {
    return await webhookLogRepository.findAll(webhookId, page, limit, filters);
  }

  async getStats(orgId: string) {
    return await webhookLogRepository.getStatsForOrg(orgId);
  }
}

export class WebhookEventService {
  async getAvailableEvents() {
    return await webhookEventRepository.getAvailableEvents();
  }
}

const webhookService = new WebhookService();
const webhookLogService = new WebhookLogService();
const webhookEventService = new WebhookEventService();

export default {
  webhookService,
  webhookLogService,
  webhookEventService,
};