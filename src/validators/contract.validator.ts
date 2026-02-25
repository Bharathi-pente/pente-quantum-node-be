import { z } from 'zod';

export const createContractSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid('Invalid customer ID'),
    name: z.string().min(2, 'Contract name must be at least 2 characters'),
    contract_type: z.enum(['prepaid', 'postpaid']),
    start_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
    end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional().nullable(),
    total_value: z.number().min(0, 'Total value must be non-negative').optional(),
    commit_amount: z.number().min(0, 'Commit amount must be non-negative').optional(),
    used_amount: z.number().min(0, 'Used amount must be non-negative').optional(),
    remaining_amount: z.number().min(0, 'Remaining amount must be non-negative').optional(),
    rate_card_id: z.string().uuid('Invalid rate card ID').optional().nullable(),
    auto_renew: z.boolean().optional(),
    payment_terms: z.string().min(1, 'Payment terms cannot be empty').optional(),
    status: z.enum(['active', 'expired', 'cancelled', 'draft']).optional(),
    amendment_count: z.number().min(0).optional(),
  }),
});

export const updateContractSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid contract ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    contract_type: z.enum(['prepaid', 'postpaid']).optional(),
    start_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
    end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional().nullable(),
    total_value: z.number().min(0).optional(),
    commit_amount: z.number().min(0).optional(),
    used_amount: z.number().min(0).optional(),
    remaining_amount: z.number().min(0).optional(),
    rate_card_id: z.string().uuid().optional().nullable(),
    auto_renew: z.boolean().optional(),
    payment_terms: z.string().min(1).optional(),
    status: z.enum(['active', 'expired', 'cancelled', 'draft']).optional(),
    amendment_count: z.number().min(0).optional(),
  }),
});

export const getContractSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid contract ID'),
  }),
});

export const getContractsQuerySchema = z.object({
  query: z.object({
    page: z.string().refine((val) => !isNaN(Number(val)), 'Page must be a number').optional(),
    limit: z.string().refine((val) => !isNaN(Number(val)), 'Limit must be a number').optional(),
    status: z.enum(['active', 'expired', 'cancelled', 'draft']).optional(),
    contract_type: z.enum(['prepaid', 'postpaid']).optional(),
    customer_id: z.string().uuid().optional(),
    search: z.string().optional(),
  }),
});