import { z } from 'zod';

export const createAlertSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    alert_type: z.enum(['usage', 'billing', 'customer', 'churn', 'system']),
    condition_expr: z.string().min(1, 'Condition expression is required'),
    threshold: z.number().optional(),
    status: z.enum(['active', 'inactive']).optional().default('active'),
  }),
});

export const updateAlertSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid alert ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    alert_type: z.enum(['usage', 'billing', 'customer', 'churn', 'system']).optional(),
    condition_expr: z.string().min(1).optional(),
    threshold: z.number().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const getAlertSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid alert ID'),
  }),
});

export const getAlertsByOrgSchema = z.object({
  params: z.object({
    orgId: z.string().uuid('Invalid organization ID'),
  }),
  query: z.object({
    status: z.enum(['active', 'inactive']).optional(),
    alert_type: z.enum(['usage', 'billing', 'customer', 'churn', 'system']).optional(),
    page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 10),
  }).optional(),
});