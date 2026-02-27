import { z } from 'zod';

export const createPaymentMethodSchema = z.object({
  body: z.object({
    method_type: z.enum(['card', 'bank_account'], {
      errorMap: () => ({ message: 'Method type must be either card or bank_account' }),
    }),
    brand: z.string().min(1, 'Brand is required').optional(),
    last4: z.string().regex(/^\d{4}$/, 'Last 4 digits must be exactly 4 numbers').optional(),
    exp_month: z.number().int().min(1).max(12).optional(),
    exp_year: z.number().int().min(new Date().getFullYear()).optional(),
    bank_name: z.string().min(1, 'Bank name is required').optional(),
    account_type: z.enum(['checking', 'savings'], {
      errorMap: () => ({ message: 'Account type must be either checking or savings' }),
    }).optional(),
    billing_name: z.string().min(1, 'Billing name is required').optional(),
    billing_address: z.object({
      line1: z.string().min(1, 'Address line 1 is required'),
      line2: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      postal_code: z.string().min(1, 'Postal code is required'),
      country: z.string().min(1, 'Country is required'),
    }).optional(),
  }).refine((data) => {
    // If method_type is card, require card-specific fields
    if (data.method_type === 'card') {
      return data.brand && data.last4 && data.exp_month && data.exp_year;
    }
    // If method_type is bank_account, require bank-specific fields
    if (data.method_type === 'bank_account') {
      return data.bank_name && data.account_type;
    }
    return true;
  }, {
    message: 'Invalid payment method data for the specified method type',
  }),
});

export const updatePaymentMethodSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid payment method ID'),
  }),
  body: z.object({
    method_type: z.enum(['card', 'bank_account']).optional(),
    brand: z.string().min(1).optional(),
    last4: z.string().regex(/^\d{4}$/, 'Last 4 digits must be exactly 4 numbers').optional(),
    exp_month: z.number().int().min(1).max(12).optional(),
    exp_year: z.number().int().min(new Date().getFullYear()).optional(),
    bank_name: z.string().min(1).optional(),
    account_type: z.enum(['checking', 'savings']).optional(),
    billing_name: z.string().min(1).optional(),
    billing_address: z.object({
      line1: z.string().min(1, 'Address line 1 is required'),
      line2: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      postal_code: z.string().min(1, 'Postal code is required'),
      country: z.string().min(1, 'Country is required'),
    }).optional(),
  }).refine((data) => {
    // If method_type is being updated to card, require card-specific fields
    if (data.method_type === 'card') {
      return data.brand && data.last4 && data.exp_month && data.exp_year;
    }
    // If method_type is being updated to bank_account, require bank-specific fields
    if (data.method_type === 'bank_account') {
      return data.bank_name && data.account_type;
    }
    return true;
  }, {
    message: 'Invalid payment method data for the specified method type',
  }),
});

export const getPaymentMethodSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid payment method ID'),
  }),
});

export const getPaymentMethodsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(val => parseInt(val)).refine(val => val > 0, 'Page must be greater than 0').optional(),
    limit: z.string().regex(/^\d+$/).transform(val => parseInt(val)).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional(),
  }),
});