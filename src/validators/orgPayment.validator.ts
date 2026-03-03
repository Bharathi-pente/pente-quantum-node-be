import { z } from 'zod';

export const createOrgPaymentSchema = z.object({
  body: z.object({
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    payment_method: z.string().min(1, 'Payment method is required'),
    status: z.enum(['succeeded', 'failed', 'pending', 'refunded']).default('pending'),
    payment_date: z.string().datetime().optional(),
    description: z.string().optional(),
  }),
});

export const updateOrgPaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid organization payment ID'),
  }),
  body: z.object({
    status: z.enum(['succeeded', 'failed', 'pending', 'refunded']).optional(),
    payment_date: z.string().datetime().optional(),
    failure_reason: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const getOrgPaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid organization payment ID'),
  }),
});

export const getOrgPaymentsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 10),
    status: z.enum(['succeeded', 'failed', 'pending', 'refunded']).optional(),
    payment_method: z.string().optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
  }),
});