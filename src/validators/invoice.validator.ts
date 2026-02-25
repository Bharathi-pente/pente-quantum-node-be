import { z } from 'zod';

export const createInvoiceSchema = z.object({
  body: z.object({
    invoice_number: z.string().min(1, 'Invoice number is required'),
    customer_id: z.string().min(1, 'Customer ID is required'),
    issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be in YYYY-MM-DD format'),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
    subtotal: z.number().min(0, 'Subtotal must be non-negative'),
    credits_applied: z.number().min(0).optional().default(0),
    tax_amount: z.number().min(0).optional().default(0),
    tax_rate: z.number().min(0).max(100).optional().default(0),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    payment_method_id: z.string().uuid().optional(),
    notes: z.string().optional(),
    status: z.enum(['draft', 'pending', 'paid', 'overdue', 'void']).optional().default('draft'),
  }),
});

export const updateInvoiceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid invoice ID'),
  }),
  body: z.object({
    invoice_number: z.string().min(1).optional(),
    status: z.enum(['draft', 'pending', 'paid', 'overdue', 'void']).optional(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    paid_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    credits_applied: z.number().min(0).optional(),
    tax_amount: z.number().min(0).optional(),
    tax_rate: z.number().min(0).max(100).optional(),
    payment_method_id: z.string().uuid().optional(),
    notes: z.string().optional(),
  }),
});

export const getInvoiceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid invoice ID'),
  }),
});

export const getInvoicesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 10),
    status: z.enum(['draft', 'pending', 'paid', 'overdue', 'void']).optional(),
    customer_id: z.string().uuid().optional(),
    invoice_number: z.string().optional(),
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

export const getOrganizationInvoicesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 10),
    status: z.enum(['draft', 'pending', 'paid', 'overdue', 'void']).optional(),
    customer_id: z.string().uuid().optional(),
    invoice_number: z.string().optional(),
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

export const getCustomerInvoicesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : 10),
    status: z.enum(['draft', 'pending', 'paid', 'overdue', 'void']).optional(),
    invoice_number: z.string().optional(),
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});