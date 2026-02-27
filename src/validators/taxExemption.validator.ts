import { z } from 'zod';

// Tax exemptions validation schemas
export const createTaxExemptionSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid('Invalid customer ID'),
    reason: z.string().min(1, 'Reason is required'),
    certificate_id: z.string().optional(),
    expires_at: z.string().datetime('Invalid expiration date').optional()
  })
});

export const updateTaxExemptionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid exemption ID')
  }),
  body: z.object({
    reason: z.string().min(1, 'Reason is required').optional(),
    certificate_id: z.string().optional(),
    expires_at: z.string().datetime('Invalid expiration date').optional()
  })
});

export const getTaxExemptionsSchema = z.object({
  query: z.object({
    customer_id: z.string().uuid('Invalid customer ID').optional(),
    status: z.enum(['active', 'expired']).optional()
  })
});

export const getTaxExemptionByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid exemption ID')
  })
});

export const deleteTaxExemptionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid exemption ID')
  })
});

export type CreateTaxExemptionInput = z.infer<typeof createTaxExemptionSchema>['body'];
export type UpdateTaxExemptionInput = z.infer<typeof updateTaxExemptionSchema>['body'];
export type GetTaxExemptionsInput = z.infer<typeof getTaxExemptionsSchema>['query'];