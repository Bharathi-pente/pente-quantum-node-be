import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    org_id: z.string().uuid('Invalid organization ID').optional(), // Optional like meters
    base_price: z.number().min(0, 'Base price must be non-negative'),
    included_units: z.record(z.any()).optional(),
    status: z.enum(['active', 'draft', 'archived']).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    base_price: z.number().min(0).optional(),
    included_units: z.record(z.any()).optional(),
    status: z.enum(['active', 'draft', 'archived']).optional(),
  }),
});

export const getProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
});
