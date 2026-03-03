import { z } from 'zod';

export const createDunningPolicySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Policy name must be at least 2 characters'),
    is_default: z.boolean().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    retry_schedule: z.array(z.any()).optional(),
  }),
});

export const updateDunningPolicySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid policy ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    is_default: z.boolean().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    retry_schedule: z.array(z.any()).optional(),
  }),
});

export const getDunningPolicySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid policy ID'),
  }),
});

export const createDunningStepSchema = z.object({
  body: z.object({
    policy_id: z.string().uuid('Invalid policy ID'),
    day_offset: z.number().int().min(0, 'Day offset must be non-negative'),
    action: z.string().min(1, 'Action is required'),
    template_name: z.string().optional(),
    subject: z.string().optional(),
    assignee: z.string().optional(),
    escalate_to: z.string().optional(),
    grace_period_days: z.number().int().min(0).optional(),
    sort_order: z.number().int().min(0).optional(),
  }),
});

export const updateDunningStepSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid step ID'),
  }),
  body: z.object({
    policy_id: z.string().uuid('Invalid policy ID'),
    day_offset: z.number().int().min(0).optional(),
    action: z.string().min(1).optional(),
    template_name: z.string().optional(),
    subject: z.string().optional(),
    assignee: z.string().optional(),
    escalate_to: z.string().optional(),
    grace_period_days: z.number().int().min(0).optional(),
    sort_order: z.number().int().min(0).optional(),
  }),
});