import { z } from 'zod';

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    billing_email: z.string().email('Invalid email address'),
    status: z.enum(['active', 'suspended', 'cancelled']).optional(),
    settings: z.record(z.any()).optional(),
  }),
});

export const updateOrganizationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid organization ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    billing_email: z.string().email().optional(),
    status: z.enum(['active', 'suspended', 'cancelled']).optional(),
    settings: z.record(z.any()).optional(),
  }),
});

export const getOrganizationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid organization ID'),
  }),
});
