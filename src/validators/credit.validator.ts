import { z } from 'zod';

// Credits validation schemas
export const createCreditSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid('Invalid customer ID'),
    credit_type: z.enum(['prepaid', 'promotional', 'commit', 'compensation'], {
      errorMap: () => ({ message: 'Credit type must be prepaid, promotional, commit, or compensation' })
    }),
    original_amount: z.number().positive('Original amount must be positive'),
    remaining_amount: z.number().min(0, 'Remaining amount cannot be negative').optional(),
    used_amount: z.number().min(0, 'Used amount cannot be negative').optional().default(0),
    expires_at: z.string().datetime('Invalid expiration date').optional(),
    priority: z.number().int().min(0).max(100).optional().default(0),
    applicable_to: z.string().optional().default('all'),
    status: z.enum(['active', 'expired', 'used'], {
      errorMap: () => ({ message: 'Status must be active, expired, or used' })
    }).optional().default('active'),
    reason: z.string().optional()
  })
});

export const updateCreditSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid credit ID')
  }),
  body: z.object({
    credit_type: z.enum(['prepaid', 'promotional', 'commit', 'compensation'], {
      errorMap: () => ({ message: 'Credit type must be prepaid, promotional, commit, or compensation' })
    }).optional(),
    original_amount: z.number().positive('Original amount must be positive').optional(),
    remaining_amount: z.number().min(0, 'Remaining amount cannot be negative').optional(),
    used_amount: z.number().min(0, 'Used amount cannot be negative').optional(),
    expires_at: z.string().datetime('Invalid expiration date').optional(),
    priority: z.number().int().min(0).max(100).optional(),
    applicable_to: z.string().optional(),
    status: z.enum(['active', 'expired', 'used'], {
      errorMap: () => ({ message: 'Status must be active, expired, or used' })
    }).optional(),
    reason: z.string().optional()
  })
});

export const getCreditsSchema = z.object({
  query: z.object({
    customer_id: z.string().uuid('Invalid customer ID').optional(),
    status: z.enum(['active', 'expired', 'used'], {
      errorMap: () => ({ message: 'Status must be active, expired, or used' })
    }).optional(),
    credit_type: z.enum(['prepaid', 'promotional', 'commit', 'compensation'], {
      errorMap: () => ({ message: 'Credit type must be prepaid, promotional, commit, or compensation' })
    }).optional(),
    page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().regex(/^\d+$/).optional().transform(val => {
      const num = val ? parseInt(val) : 10;
      if (num > 0 && num <= 100) return num;
      throw new Error('Limit must be between 1 and 100');
    }),
  })
});

export const getCreditByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid credit ID')
  })
});

export const deleteCreditSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid credit ID')
  })
});

// Credit Ledger validation schemas
export const createCreditLedgerEntrySchema = z.object({
  body: z.object({
    credit_id: z.string().uuid('Invalid credit ID'),
    txn_type: z.enum(['usage', 'grant', 'adjustment', 'expiry'], {
      errorMap: () => ({ message: 'Transaction type must be usage, grant, adjustment, or expiry' })
    }),
    amount: z.number().refine(val => val !== 0, 'Amount cannot be zero'),
    description: z.string().optional()
  })
});

export const getCreditLedgerSchema = z.object({
  params: z.object({
    creditId: z.string().uuid('Invalid credit ID')
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().regex(/^\d+$/).optional().transform(val => {
      const num = val ? parseInt(val) : 10;
      if (num > 0 && num <= 100) return num;
      throw new Error('Limit must be between 1 and 100');
    })
  })
});

export type CreateCreditInput = z.infer<typeof createCreditSchema>;
export type UpdateCreditInput = z.infer<typeof updateCreditSchema>;
export type GetCreditsInput = z.infer<typeof getCreditsSchema>;
export type GetCreditByIdInput = z.infer<typeof getCreditByIdSchema>;
export type DeleteCreditInput = z.infer<typeof deleteCreditSchema>;
export type CreateCreditLedgerEntryInput = z.infer<typeof createCreditLedgerEntrySchema>;
export type GetCreditLedgerInput = z.infer<typeof getCreditLedgerSchema>;