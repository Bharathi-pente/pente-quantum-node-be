import { z } from 'zod';

const rateLimitRuleSchema = z.object({
  endpoint: z.string().min(1, 'Endpoint is required'),
  requests_limit: z.number().int().min(1, 'Requests limit must be at least 1'),
  time_window: z.string().min(1, 'Time window is required'),
  burst_limit: z.number().int().min(0).optional(),
});

export const createRateLimitPolicySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Policy name is required'),
    product_id: z.string().min(1, 'Product ID is required'),
    status: z.enum(['active', 'inactive']).optional().default('active'),
    rules: z.array(rateLimitRuleSchema).optional(),
  }),
});

export const updateRateLimitPolicySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid policy ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    rules: z.array(rateLimitRuleSchema).optional(),
  }),
});

export const getRateLimitPolicySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid policy ID'),
  }),
});

export const getRateLimitPoliciesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 10),
    status: z.enum(['active', 'inactive']).optional(),
    product_id: z.string().uuid().optional(),
  }),
});

export const getByProductSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID'),
  }),
});
