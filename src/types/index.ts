export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface FilterQuery extends PaginationQuery {
  search?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface JWTPayload {
  id: string;
  email: string;
  orgId: string;
  roleId: string;
  permissions?: string[];
}

export interface ApiResponseType<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface Webhook {
  id: string;
  org_id: string;
  name: string;
  url: string;
  subscribed_events: any; // JSON field
  status: string;
  success_rate?: any; // Decimal from Prisma
  last_triggered_at?: Date | null;
  created_at: Date;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  status: string;
  responseCode?: number | null;
  responseTime?: number | null;
  timestamp: string;
  payload?: any;
  error?: string | null;
  retryCount?: number | null;
}

export interface WebhookEvent {
  event_type: string;
  data: any;
  timestamp: Date;
}

export interface AuditLog {
  id: string;
  org_id: string;
  actor: string;
  actor_name?: string | null;
  action: string;
  resource_label?: string | null;
  resource_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  status: string;
  details?: any;
  created_at: Date;
}

export interface AuditLogFilter extends FilterQuery {
  actor?: string;
  action?: string;
  resource_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}
