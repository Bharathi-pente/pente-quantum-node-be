import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    invoice_id: z.string().uuid('Invalid invoice ID'),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    payment_method_id: z.string().uuid('Invalid payment method ID'),
    payment_date: z.string().datetime().optional(),
    description: z.string().optional(),
  }),
});

export const updatePaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid payment ID'),
  }),
  body: z.object({
    status: z.enum(['succeeded', 'failed', 'pending', 'refunded']).optional(),
    payment_date: z.string().datetime().optional(),
    failure_reason: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const getPaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid payment ID'),
  }),
});

export const getPaymentsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 10),
    status: z.enum(['succeeded', 'failed', 'pending', 'refunded']).optional(),
    customer_id: z.string().uuid().optional(),
    invoice_id: z.string().uuid().optional(),
    payment_method_id: z.string().uuid().optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
  }),
});