

/**
 * BillingClient — Integration adapter for Billing Service
 * 
 * This is the ONLY place where HTTP calls to the billing service are made.
 * All services use this client to interact with billing/Lago.
 * 
 * Pattern: Fire-and-recover (non-blocking, errors are logged not thrown)
 * Auth: Bearer token (BILLING_SERVICE_API_KEY)
 * Timeout: 8 seconds
 */

import logger from '../config/logger';

export type LagoPlanCode = 'starter' | 'pro' | 'enterprise';

export interface CreateOrganizationPayload {
  internal_id: string;   // organization UUID from backend
  name:        string;
  slug:        string;
  billing_email: string;
  status?:     string;
  settings?:   Record<string, any>;
}

export interface CreateCustomerPayload {
  internal_id: string;   // organization or customer UUID from backend
  org_id:      string;   // always the organization UUID
  name:        string;
  email:       string;
  plan_code:   LagoPlanCode;
  metadata?:   Record<string, any>;  // Additional organization/customer metadata
}

export interface PushEventPayload {
  internal_customer_id: string;  // org_id or customer_id depending on BILLING_LEVEL
  event_code:           string;  // Lago event code (e.g., 'input_tokens')
  properties:           Record<string, number>;
}

export interface PushBatchEventsPayload {
  events: PushEventPayload[];
}

export interface UpdateSubscriptionPayload {
  internal_customer_id: string;
  plan_code:            LagoPlanCode;
}

export interface CreatePlanPayload {
  internal_id: string;   // product UUID from backend
  name:        string;
  code:        string;
  interval:    string;
  pay_in_advance: boolean;
  amount_cents: number;
  amount_currency: string;
  description?: string;
}

export interface CreateBillableMetricPayload {
  internal_id: string;   // meter UUID from backend
  name:        string;
  code:        string;
  aggregation_type: string;
  field_name: string;
  description?: string;
  recurring?: boolean;
}

export interface BillingClientResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class BillingClient {
    /**
     * Create an invoice in the billing service and Lago
     * Called from InvoiceService.create()
     */
    async createInvoice(payload: any): Promise<BillingClientResponse<any>> {
      return this.request<any>(
        'POST', '/api/v1/invoices', payload
      );
    }
  private readonly baseUrl: string;
  private readonly apiKey:  string;
  private readonly timeoutMs = 8000;
  private readonly enabled: boolean;

  constructor() {
    this.baseUrl = process.env.BILLING_SERVICE_URL ?? 'http://localhost:4000';
    this.apiKey  = process.env.BILLING_SERVICE_API_KEY ?? '';
    this.enabled = !!this.apiKey && process.env.BILLING_INTEGRATION_ENABLED !== 'false';
    
    if (!this.enabled) {
      logger.warn('BillingClient: Integration disabled (missing BILLING_SERVICE_API_KEY or BILLING_INTEGRATION_ENABLED=false)');
    }
  }

  /**
   * Internal HTTP request method with timeout and error handling
   */
  private async request<T>(method: string, path: string, body?: unknown): Promise<BillingClientResponse<T>> {
    if (!this.enabled) {
      logger.debug('BillingClient: Skipping request (integration disabled)', { method, path });
      return { success: false, error: 'Billing integration disabled' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const startTime = Date.now();
    
    try {
      logger.debug('BillingClient: Request', { method, path, timeout: this.timeoutMs });

      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body:   body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const duration = Date.now() - startTime;

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const error = `BillingService ${method} ${path} → ${res.status}: ${text}`;
        logger.error('BillingClient: Request failed', { 
          method, path, status: res.status, duration, error: text 
        });
        return { success: false, error };
      }

      const data = await res.json() as T;
      logger.info('BillingClient: Request succeeded', { method, path, duration });
      
      return { success: true, data };

    } catch (err: any) {
      const duration = Date.now() - startTime;
      
      if (err.name === 'AbortError') {
        logger.error('BillingClient: Request timeout', { method, path, timeout: this.timeoutMs });
        return { success: false, error: 'Request timeout' };
      }
      
      logger.error('BillingClient: Request error', { 
        method, path, duration, error: err.message, stack: err.stack 
      });
      return { success: false, error: err.message };

    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Create an organization in the billing service
   * Called from OrganizationService.create()
   */
  async createOrganization(payload: CreateOrganizationPayload): Promise<BillingClientResponse<any>> {
    return this.request<any>(
      'POST', '/api/v1/organizations', payload
    );
  }

  /**
   * Create a customer in the billing service and Lago
   * Called from OrganizationService.create() or CustomerService.create()
   */
  async createCustomer(payload: CreateCustomerPayload): Promise<BillingClientResponse<{ customer: any; subscription: any }>> {
    return this.request<{ customer: any; subscription: any }>(
      'POST', '/api/v1/customers', payload
    );
  }

  /**
   * Create a plan in the billing service and Lago
   * Called from ProductService.create()
   */
  async createPlan(payload: CreatePlanPayload): Promise<BillingClientResponse<any>> {
    return this.request<any>(
      'POST', '/api/v1/plans', payload
    );
  }

  /**
   * Create a billable metric in the billing service and Lago
   * Called from MeterService.create()
   */
  async createBillableMetric(payload: CreateBillableMetricPayload): Promise<BillingClientResponse<any>> {
    return this.request<any>(
      'POST', '/api/v1/billable-metrics', payload
    );
  }

  /**
   * Push a single usage event to the billing service
   * Called from UsageEventService.track()
   */
  async pushEvent(payload: PushEventPayload): Promise<BillingClientResponse<{ transaction_id: string }>> {
    return this.request<{ transaction_id: string }>(
      'POST', '/api/v1/events', payload
    );
  }

  /**
   * Push multiple usage events in batch to the billing service
   * Called from UsageEventService.trackBatch()
   */
  async pushBatchEvents(payload: PushBatchEventsPayload): Promise<BillingClientResponse<void>> {
    return this.request<void>(
      'POST', '/api/v1/events/batch', payload
    );
  }

  /**
   * Update a customer's subscription plan (upgrade/downgrade)
   * Called from SubscriptionService.changePlan()
   */
  async updateSubscription(payload: UpdateSubscriptionPayload): Promise<BillingClientResponse<void>> {
    return this.request<void>(
      'PATCH', `/api/v1/subscriptions/${payload.internal_customer_id}`,
      { plan_code: payload.plan_code }
    );
  }

  /**
   * Terminate a customer's subscription
   * Called when a customer is deleted or subscription ends
   */
  async terminateSubscription(internalCustomerId: string): Promise<BillingClientResponse<void>> {
    return this.request<void>(
      'DELETE', `/api/v1/subscriptions/${internalCustomerId}`
    );
  }

  /**
   * Get current usage for a customer
   * Used for displaying usage in UI or usage-based billing reports
   */
  async getUsage(internalCustomerId: string): Promise<BillingClientResponse<any>> {
    return this.request<any>(
      'GET', `/api/v1/events/usage/${internalCustomerId}`
    );
  }

  /**
   * Top up customer credits/wallet
   * Called from payment processing or manual credit adjustment
   */
  async topUpCredits(
    internalCustomerId: string, 
    amountCents: number, 
    currency = 'USD',
    description?: string
  ): Promise<BillingClientResponse<void>> {
    return this.request<void>(
      'POST', '/api/v1/credits/topup',
      { 
        internal_customer_id: internalCustomerId, 
        amount_cents: amountCents, 
        currency,
        description: description ?? 'Manual top-up'
      }
    );
  }

  /**
   * Get customer's credit balance
   */
  async getCredits(internalCustomerId: string): Promise<BillingClientResponse<any>> {
    return this.request<any>(
      'GET', `/api/v1/credits/${internalCustomerId}`
    );
  }

  /**
   * Apply a coupon to a customer
   */
  async applyCoupon(internalCustomerId: string, couponCode: string): Promise<BillingClientResponse<void>> {
    return this.request<void>(
      'POST', '/api/v1/coupons/apply',
      { internal_customer_id: internalCustomerId, coupon_code: couponCode }
    );
  }

  /**
   * Remove a coupon from a customer
   */
  async removeCoupon(internalCustomerId: string, couponCode: string): Promise<BillingClientResponse<void>> {
    return this.request<void>(
      'DELETE', `/api/v1/coupons/${internalCustomerId}/${couponCode}`
    );
  }

  /**
   * Health check — verify billing service is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch (err) {
      logger.error('BillingClient: Health check failed', { error: (err as Error).message });
      return false;
    }
  }

  /**
   * Get Lago organization settings
   * Called from admin endpoints
   */
  async getOrganizationSettings(): Promise<BillingClientResponse<any>> {
    return this.request<any>('GET', '/api/v1/admin/organization');
  }

  /**
   * Update Lago organization settings
   * Called from admin endpoints
   */
  async updateOrganizationSettings(settings: Record<string, any>): Promise<BillingClientResponse<any>> {
    return this.request<any>('PATCH', '/api/v1/admin/organization', settings);
  }
}

// Singleton instance
let billingClientInstance: BillingClient | null = null;

/**
 * Get the singleton BillingClient instance
 */
export function getBillingClient(): BillingClient {
  if (!billingClientInstance) {
    billingClientInstance = new BillingClient();
  }
  return billingClientInstance;
}

export default BillingClient;
