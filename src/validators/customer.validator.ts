import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    org_id: z.string().uuid('Invalid organization ID'),
    product_id: z.string().uuid('Invalid product ID').optional(),
    status: z.enum(['active', 'trial', 'churned', 'suspended']).optional(),
    mrr: z.number().min(0).optional(),
    credit_balance: z.number().optional(),
    health_score: z.number().min(0).max(100).optional(),
    primary_contact: z.string().optional(),
    phone: z.string().optional(),
    billing_currency: z.enum(['USD', 'EUR', 'GBP']).optional(),
    billing_cycle: z.enum(['monthly', 'quarterly', 'annual']).optional(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    product_id: z.string().uuid().optional(),
    status: z.enum(['active', 'trial', 'churned', 'suspended']).optional(),
    mrr: z.number().min(0).optional(),
    credit_balance: z.number().optional(),
    health_score: z.number().min(0).max(100).optional(),
    primary_contact: z.string().optional(),
    phone: z.string().optional(),
    billing_currency: z.enum(['USD', 'EUR', 'GBP']).optional(),
    billing_cycle: z.enum(['monthly', 'quarterly', 'annual']).optional(),
  }),
});

export const getCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID'),
  }),
});
