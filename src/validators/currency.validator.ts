import { z } from 'zod';

// Schema for creating currency config
export const createCurrencyConfigSchema = z.object({
  body: z.object({
    base_currency: z.string().length(3).toUpperCase(),
    supported_currencies: z.array(z.string().length(3)).optional(),
    exchange_rates: z.record(z.number()).optional(),
    auto_update_rates: z.boolean().optional()
  })
});

// Schema for updating currency config
export const updateCurrencyConfigSchema = z.object({
  body: z.object({
    base_currency: z.string().length(3).toUpperCase().optional(),
    supported_currencies: z.array(z.string().length(3)).optional(),
    exchange_rates: z.record(z.number()).optional(),
    auto_update_rates: z.boolean().optional()
  })
});

// Schema for getting currency config
export const getCurrencyConfigSchema = z.object({
  query: z.record(z.any()).optional()
});

// Type exports
export type CreateCurrencyConfigInput = z.infer<typeof createCurrencyConfigSchema>['body'];
export type UpdateCurrencyConfigInput = z.infer<typeof updateCurrencyConfigSchema>['body'];
export type GetCurrencyConfigInput = z.infer<typeof getCurrencyConfigSchema>['query'];
