/**
 * BullMQ Queue Configuration
 * 
 * Configure job queues for background processing
 */

import { Queue, QueueOptions } from 'bullmq';
import { Redis } from 'ioredis';
import logger from './logger';

// Redis connection for BullMQ
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
});

redisConnection.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisConnection.on('connect', () => {
  logger.info('✅ Redis connected for BullMQ');
});

// Default queue options
const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // keep up to 24 hours
      count: 1000, // keep up to 1000 jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // keep up to 7 days
    },
  },
};

// Queue definitions
export const QUEUE_NAMES = {
  INVOICE: 'invoice-queue',
  REPORT: 'report-queue',
  EMAIL: 'email-queue',
  WEBHOOK: 'webhook-queue',
  USAGE_AGGREGATION: 'usage-aggregation-queue',
};

// Create queues
export const invoiceQueue = new Queue(QUEUE_NAMES.INVOICE, {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 1, // High priority
  },
});

export const reportQueue = new Queue(QUEUE_NAMES.REPORT, {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 2, // Medium priority
  },
});

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 3, // Lower priority
  },
});

export const webhookQueue = new Queue(QUEUE_NAMES.WEBHOOK, {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 5, // More retries for webhooks
    priority: 2,
  },
});

export const usageAggregationQueue = new Queue(QUEUE_NAMES.USAGE_AGGREGATION, {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 1, // High priority for billing accuracy
  },
});

// Job types
export enum InvoiceJobType {
  GENERATE = 'generate',
  FINALIZE = 'finalize',
  SEND = 'send',
  VOID = 'void',
}

export enum ReportJobType {
  REVENUE = 'revenue',
  USAGE = 'usage',
  CUSTOMER = 'customer',
  MRR = 'mrr',
}

// Job data interfaces
export interface InvoiceJobData {
  type: InvoiceJobType;
  invoiceId?: string;
  customerId?: string;
  organizationId: string;
  billingPeriod?: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, any>;
}

export interface ReportJobData {
  type: ReportJobType;
  organizationId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  format?: 'pdf' | 'csv' | 'xlsx';
  recipientEmail?: string;
  metadata?: Record<string, any>;
}

export interface EmailJobData {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export interface WebhookJobData {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payload: Record<string, any>;
  organizationId: string;
  event: string;
}

export interface UsageAggregationJobData {
  meterId: string;
  customerId: string;
  organizationId: string;
  period: {
    start: Date;
    end: Date;
  };
}

// Helper functions to add jobs
export const addInvoiceJob = async (data: InvoiceJobData, options?: any) => {
  return await invoiceQueue.add(`invoice-${data.type}`, data, options);
};

export const addReportJob = async (data: ReportJobData, options?: any) => {
  return await reportQueue.add(`report-${data.type}`, data, options);
};

export const addEmailJob = async (data: EmailJobData, options?: any) => {
  return await emailQueue.add('send-email', data, options);
};

export const addWebhookJob = async (data: WebhookJobData, options?: any) => {
  return await webhookQueue.add(`webhook-${data.event}`, data, options);
};

export const addUsageAggregationJob = async (data: UsageAggregationJobData, options?: any) => {
  return await usageAggregationQueue.add('aggregate-usage', data, options);
};

logger.info('✅ BullMQ queues initialized');
