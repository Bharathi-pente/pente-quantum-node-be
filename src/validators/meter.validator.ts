import { z } from 'zod';

export const createMeterSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    event_type: z.string().min(2, 'Event type must be at least 2 characters'),
    aggregation: z.enum(['SUM', 'COUNT', 'MAX', 'AVG']),
    field: z.string().min(1, 'Field is required'),
    status: z.enum(['active', 'draft', 'archived']).optional(),
    billable_metric_code: z.string().optional(),
    billable_metric_description: z.string().optional(),
    recurring: z.boolean().optional(),
  }),
});

export const updateMeterSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid meter ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    event_type: z.string().min(2).optional(),
    aggregation: z.enum(['SUM', 'COUNT', 'MAX', 'AVG']).optional(),
    field: z.string().min(1).optional(),
    status: z.enum(['active', 'draft', 'archived']).optional(),
    billable_metric_code: z.string().optional(),
    billable_metric_description: z.string().optional(),
    recurring: z.boolean().optional(),
  }),
});

export const getMeterSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid meter ID'),
  }),
});

export const getRealtimeReadingsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid meter ID'),
  }),
  query: z.object({
    timeframe: z.enum(['1h', '24h', '7d', '30d']).optional().default('24h'),
    granularity: z.enum(['minute', 'hour', 'day']).optional().default('hour'),
  }),
});

export const getRealtimeStatsSchema = z.object({
  query: z.object({
    event_type: z.string().optional(),
    timeframe: z.enum(['1h', '24h', '7d', '30d']).optional().default('24h'),
  }),
});

export const getRealtimeEventsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid meter ID'),
  }),
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional().transform(val => val ? Math.min(parseInt(val), 100) : 50),
    since: z.string().datetime().optional(),
  }),
});

export const getPerformanceMetricsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid meter ID'),
  }),
  query: z.object({
    timeframe: z.enum(['1h', '24h', '7d', '30d']).optional().default('24h'),
  }),
});

export const getHealthMonitoringSchema = z.object({
  query: z.object({
    status: z.enum(['healthy', 'warning', 'critical', 'offline']).optional(),
    event_type: z.string().optional(),
  }),
});