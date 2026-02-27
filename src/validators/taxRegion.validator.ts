import { z } from 'zod';

// Tax regions validation schemas
export const createTaxRegionSchema = z.object({
  body: z.object({
    country_code: z.string().length(2, 'Country code must be 2 characters'),
    state_code: z.string().optional(),
    rate: z.number().min(0).max(1, 'Rate must be between 0 and 1'),
    name: z.string().min(1, 'Name is required'),
    tax_type: z.string().min(1, 'Tax type is required'),
    status: z.enum(['active', 'inactive']).optional().default('active')
  })
});

export const updateTaxRegionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid region ID')
  }),
  body: z.object({
    country_code: z.string().length(2, 'Country code must be 2 characters').optional(),
    state_code: z.string().optional(),
    rate: z.number().min(0).max(1, 'Rate must be between 0 and 1').optional(),
    name: z.string().min(1, 'Name is required').optional(),
    tax_type: z.string().min(1, 'Tax type is required').optional(),
    status: z.enum(['active', 'inactive']).optional()
  })
});

export const getTaxRegionsSchema = z.object({
  query: z.object({
    status: z.enum(['active', 'inactive']).optional(),
    country_code: z.string().optional()
  })
});

export const getTaxRegionByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid region ID')
  })
});

export const deleteTaxRegionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid region ID')
  })
});

export type CreateTaxRegionInput = z.infer<typeof createTaxRegionSchema>['body'];
export type UpdateTaxRegionInput = z.infer<typeof updateTaxRegionSchema>['body'];
export type GetTaxRegionsInput = z.infer<typeof getTaxRegionsSchema>['query'];