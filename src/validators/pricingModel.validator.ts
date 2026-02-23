import { z } from 'zod';

export const createPricingModelSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    pricing_type: z.enum(['per_unit', 'tiered', 'volume', 'package']),
    meter_id: z.string().uuid('Invalid meter ID'),
    unit_price: z.number().min(0).optional(),
    unit_label: z.string().min(1, 'Unit label is required'),
    status: z.enum(['active', 'draft', 'archived']).optional(),
  }),
});

export const updatePricingModelSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid pricing model ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    pricing_type: z.enum(['per_unit', 'tiered', 'volume', 'package']).optional(),
    meter_id: z.string().uuid().optional(),
    unit_price: z.number().min(0).optional(),
    unit_label: z.string().min(1).optional(),
    status: z.enum(['active', 'draft', 'archived']).optional(),
  }),
});

export const getPricingModelSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid pricing model ID'),
  }),
});