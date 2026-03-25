/**
 * Standard Data Transfer Objects (DTOs)
 * 
 * Provides type-safe interfaces for API requests and responses.
 * Eliminates 'any' types and improves TypeScript coverage.
 */

/**
 * Base DTO with org_id for multi-tenant operations
 */
export interface BaseDTO {
  org_id: string;
}

/**
 * Pagination request parameters
 */
export interface PaginationRequest {
  page?: number;
  limit?: number;
}

/**
 * Cursor pagination request
 */
export interface CursorPaginationRequest {
  cursor?: string;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Common filter parameters
 */
export interface CommonFilters {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * Customer DTOs
 */
export interface CreateCustomerDTO extends BaseDTO {
  name: string;
  email: string;
  product_id?: string;
  rate_card_override?: string;
  status?: string;
  mrr?: number;
  credit_balance?: number;
  health_score?: number;
  primary_contact?: string;
  phone?: string;
  billing_currency?: string;
  billing_cycle?: string;
}

export interface UpdateCustomerDTO {
  name?: string;
  email?: string;
  product_id?: string;
  rate_card_override?: string;
  status?: string;
  mrr?: number;
  credit_balance?: number;
  health_score?: number;
  primary_contact?: string;
  phone?: string;
  billing_currency?: string;
  billing_cycle?: string;
}

export interface CustomerFilters extends CommonFilters {
  product_id?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

/**
 * Product DTOs
 */
export interface CreateProductDTO extends BaseDTO {
  name: string;
  description?: string;
  base_price?: number;
  status?: 'active' | 'draft' | 'archived';
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  base_price?: number;
  status?: 'active' | 'draft' | 'archived';
}

/**
 * Invoice DTOs
 */
export interface CreateInvoiceDTO extends BaseDTO {
  customer_id: string;
  invoice_number: string;
  billing_period_start: Date;
  billing_period_end: Date;
  subtotal: number;
  tax: number;
  total: number;
  currency?: string;
  status?: 'draft' | 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: Date;
}

export interface UpdateInvoiceDTO {
  status?: 'draft' | 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal?: number;
  tax?: number;
  total?: number;
  due_date?: Date;
  paid_date?: Date;
}

export interface InvoiceFilters extends CommonFilters {
  customer_id?: string;
  status?: string;
  overdue?: boolean;
}

/**
 * Payment DTOs
 */
export interface CreatePaymentDTO extends BaseDTO {
  customer_id: string;
  invoice_id?: string;
  amount: number;
  currency?: string;
  payment_method: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
}

export interface UpdatePaymentDTO {
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
}

/**
 * Contract DTOs
 */
export interface CreateContractDTO extends BaseDTO {
  customer_id: string;
  name: string;
  status?: 'active' | 'expired' | 'cancelled';
  contract_type: string;
  start_date: Date;
  end_date?: Date;
  total_value: number;
  commit_amount?: number;
  rate_card_id?: string;
  auto_renew?: boolean;
  payment_terms?: string;
}

export interface UpdateContractDTO {
  name?: string;
  status?: 'active' | 'expired' | 'cancelled';
  end_date?: Date;
  total_value?: number;
  commit_amount?: number;
  auto_renew?: boolean;
}

/**
 * Meter DTOs
 */
export interface CreateMeterDTO extends BaseDTO {
  name: string;
  event_type: string;
  aggregation: 'SUM' | 'COUNT' | 'MAX' | 'AVG';
  field: string;
  status?: 'active' | 'draft' | 'archived';
}

export interface UpdateMeterDTO {
  name?: string;
  event_type?: string;
  aggregation?: 'SUM' | 'COUNT' | 'MAX' | 'AVG';
  field?: string;
  status?: 'active' | 'draft' | 'archived';
}

/**
 * Usage Event DTOs
 */
export interface CreateUsageEventDTO extends BaseDTO {
  customer_id?: string;
  meter_id: string;
  event_type: string;
  event_timestamp: Date;
  quantity: number;
  metadata?: Record<string, any>;
}

/**
 * Alert DTOs
 */
export interface CreateAlertDTO extends BaseDTO {
  name: string;
  alert_type: string;
  condition_expr: string;
  threshold?: number;
  status?: 'active' | 'inactive';
}

export interface UpdateAlertDTO {
  name?: string;
  alert_type?: string;
  condition_expr?: string;
  threshold?: number;
  status?: 'active' | 'inactive';
}

/**
 * User DTOs
 */
export interface CreateUserDTO extends BaseDTO {
  name: string;
  email: string;
  role_id?: string;
  status?: 'active' | 'invited' | 'suspended';
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  role_id?: string;
  status?: 'active' | 'invited' | 'suspended';
}

/**
 * API Key DTOs
 */
export interface CreateApiKeyDTO extends BaseDTO {
  name: string;
  environment?: 'production' | 'sandbox';
  scopes?: string[];
  status?: 'active' | 'revoked';
}

export interface UpdateApiKeyDTO {
  name?: string;
  scopes?: string[];
  status?: 'active' | 'revoked';
}

/**
 * Email Template DTOs
 */
export interface CreateEmailTemplateDTO extends BaseDTO {
  name: string;
  template_id: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables?: string[];
}

export interface UpdateEmailTemplateDTO {
  name?: string;
  subject?: string;
  html_content?: string;
  text_content?: string;
  variables?: string[];
}

/**
 * Webhook DTOs
 */
export interface CreateWebhookDTO extends BaseDTO {
  name: string;
  url: string;
  subscribed_events: string[];
  status?: 'active' | 'inactive';
}

export interface UpdateWebhookDTO {
  name?: string;
  url?: string;
  subscribed_events?: string[];
  status?: 'active' | 'inactive';
}

/**
 * Audit Log Query DTO
 */
export interface AuditLogFilters extends CommonFilters {
  actor?: string;
  action?: string;
  resource_id?: string;
}

/**
 * Response DTOs
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  meta?: any;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Generic ID parameter
 */
export interface IdParam {
  id: string;
}

/**
 * Bulk operation DTOs
 */
export interface BulkDeleteDTO {
  ids: string[];
}

export interface BulkUpdateDTO<T> {
  ids: string[];
  data: Partial<T>;
}
