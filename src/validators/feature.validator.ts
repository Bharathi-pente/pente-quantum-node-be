import { z } from 'zod';

export const createFeatureSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    category: z.enum(['core', 'security', 'ai', 'integration', 'support']),
    status: z.enum(['active', 'deprecated']).optional(),
  }),
});

export const updateFeatureSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid feature ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    category: z.enum(['core', 'security', 'ai', 'integration', 'support']).optional(),
    status: z.enum(['active', 'deprecated']).optional(),
  }),
});

export const getFeatureSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid feature ID'),
  }),
});