import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100),
  description: z.string().optional(),
  org_id: z.string().uuid('Invalid organization ID'),
  permissions: z.array(z.string()).optional().default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});