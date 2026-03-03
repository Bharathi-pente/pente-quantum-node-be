import { z } from 'zod';

/**
 * Entitlement grant validation schemas
 */

export const createEntitlementGrantSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid('Invalid customer ID format'),
    feature_id: z.string().uuid('Invalid feature ID format'),
    reason: z.string().optional(),
    expires_at: z.string().optional(),
    granted_by: z.string().optional(),
  }),
});

export const updateEntitlementGrantSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid entitlement grant ID'),
  }),
  body: z.object({
    customer_id: z.string().uuid('Invalid customer ID format').optional(),
    feature_id: z.string().uuid('Invalid feature ID format').optional(),
    reason: z.string().optional(),
    expires_at: z.string().datetime().nullable().optional(),
    granted_by: z.string().optional(),
  }),
});

export const getEntitlementGrantSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid entitlement grant ID'),
  }),
});

export const checkEntitlementSchema = z.object({
  query: z.object({
    customer_id: z.string().uuid('Invalid customer ID format'),
    feature_id: z.string().uuid('Invalid feature ID format'),
  }),
});

export const getEntitlementGrantsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional(),
    limit: z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional(),
    customer_id: z.string().uuid().optional(),
    feature_id: z.string().uuid().optional(),
    status: z.enum(['active', 'expired']).optional(),
  }),
});