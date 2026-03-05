import { z } from 'zod';

export const createUsageLimitSchema = z.object({
  body: z.object({
    product_id: z.string().uuid('Invalid product ID'),
    meter_id: z.string().uuid('Invalid meter ID'),
    limit_type: z.enum(['hard', 'soft', 'none'], { message: 'Limit type must be hard, soft, or none' }),
    limit_value: z.number().int().min(0, 'Limit value must be non-negative'),
    period: z.enum(['monthly', 'daily'], { message: 'Period must be monthly or daily' }),
    warning_threshold_pct: z.number().int().min(0).max(100).optional().default(80),
    status: z.enum(['active', 'inactive']).optional().default('active'),
  }),
});

export const updateUsageLimitSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid usage limit ID'),
  }),
  body: z.object({
    limit_type: z.enum(['hard', 'soft', 'none']).optional(),
    limit_value: z.number().int().min(0).optional(),
    period: z.enum(['monthly', 'daily']).optional(),
    warning_threshold_pct: z.number().int().min(0).max(100).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const getUsageLimitSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid usage limit ID'),
  }),
});

export const getUsageLimitsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 10),
    product_id: z.string().uuid().optional(),
    meter_id: z.string().uuid().optional(),
    limit_type: z.enum(['hard', 'soft', 'none']).optional(),
    period: z.enum(['monthly', 'daily']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const createLimitOverrideSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid('Invalid customer ID'),
    meter_id: z.string().uuid('Invalid meter ID'),
    new_limit: z.number().int().min(0, 'New limit must be non-negative'),
    reason: z.string().min(1, 'Reason is required'),
    expires_at: z.string().datetime().optional(),
  }),
});

export const updateLimitOverrideSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid limit override ID'),
  }),
  body: z.object({
    new_limit: z.number().int().min(0).optional(),
    reason: z.string().min(1).optional(),
    expires_at: z.string().datetime().optional(),
  }),
});

export const getLimitOverrideSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid limit override ID'),
  }),
});

export const getLimitOverridesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 10),
    customer_id: z.string().uuid().optional(),
    meter_id: z.string().uuid().optional(),
    active_only: z.string().optional().default('true'),
  }),
});

export const getCurrentUsageQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1').transform(val => parseInt(val)),
    limit: z.string().optional().default('10').transform(val => parseInt(val)),
    customer_id: z.string().uuid().optional(),
    product_id: z.string().uuid().optional(),
    meter_id: z.string().uuid().optional(),
  }),
});

export const getUsageStatsQuerySchema = z.object({
  query: z.object({
    customer_id: z.string().uuid().optional(),
    product_id: z.string().uuid().optional(),
    period: z.enum(['daily', 'monthly', 'yearly']).optional().default('monthly'),
  }),
});