import { z } from 'zod';

export const createWebhookSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    url: z.string().url('Invalid URL format'),
    subscribed_events: z.array(z.string()).min(1, 'At least one event must be subscribed'),
    status: z.string().optional(),
  }),
});

export const updateWebhookSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid webhook ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    url: z.string().url().optional(),
    subscribed_events: z.array(z.string()).min(1).optional(),
    status: z.string().optional(),
  }),
});

export const getWebhookSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid webhook ID'),
  }),
});

export const getWebhookLogsSchema = z.object({
  query: z.object({
    webhookId: z.string().uuid().optional(),
    event: z.string().optional(),
    status: z.string().optional(),
    page: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseInt(val) : val).optional(),
    limit: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseInt(val) : val).optional(),
  }),
});