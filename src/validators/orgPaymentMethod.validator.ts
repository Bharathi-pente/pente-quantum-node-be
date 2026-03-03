import { z } from 'zod';

export const createOrgPaymentMethodSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.string().min(1, 'Type is required'),
    details: z.record(z.any()).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const updateOrgPaymentMethodSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid payment method ID'),
  }),
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    type: z.string().min(1, 'Type is required').optional(),
    details: z.record(z.any()).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const getOrgPaymentMethodSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid payment method ID'),
  }),
});

export const getOrgPaymentMethodsQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val)).optional(),
    limit: z.string().transform(val => parseInt(val)).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    type: z.string().optional(),
    search: z.string().optional(),
  }),
});