import { z } from 'zod';

// Tax config validation schemas
export const createTaxConfigSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional().default(false),
    default_rate: z.number().min(0).max(1).optional()
  })
});

export const updateTaxConfigSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    default_rate: z.number().min(0).max(1).optional()
  })
});

export const getTaxConfigSchema = z.object({
  query: z.record(z.any()).optional()
});

export type CreateTaxConfigInput = z.infer<typeof createTaxConfigSchema>['body'];
export type UpdateTaxConfigInput = z.infer<typeof updateTaxConfigSchema>['body'];