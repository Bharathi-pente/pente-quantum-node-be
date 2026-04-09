# Billing Service Integration Guide

## Overview

This document describes the integration between **QuantumBilling Backend** and the **Billing Service** (Lago-based). The integration enables usage-based billing, subscription management, and invoice handling via an external microservice.

## Architecture

```
┌─────────────────────┐         HTTP REST          ┌──────────────────────┐         HTTP API         ┌────────────┐
│  QuantumBilling     │──────Bearer Token──────────▶│   Billing Service    │───────────────────────▶│    Lago    │
│     Backend         │       (Internal)            │  (Node.js · Microservice)     (Self-hosted)    │
│ (TypeScript · Prisma)│                            │   (Express · pg)      │                        │  Engine     │
└─────────────────────┘                            └──────────────────────┘                        └────────────┘
         │                                                     │
         │                                                     │
         ▼                                                     ▼
  ┌─────────────┐                                       ┌────────────────┐
  │ PostgreSQL  │                                       │  PostgreSQL    │
  │ (Main DB)   │                                       │  (Billing DB)  │
  │ 49 tables   │                                       │  4 tables      │
  └─────────────┘                                       └────────────────┘
```

## Key Principles

1. **No Shared Database** — Backend and billing service use separate PostgreSQL instances
2. **No Shared Code** — No imports between services
3. **HTTP REST Only** — Communication via internal API calls (Bearer token)
4. **Fire-and-Recover Pattern** — Billing calls happen AFTER database commit; failures are logged, not thrown
5. **Single Integration Point** — All billing calls go through `BillingClient` class

## Integration Points (4 Triggers)

### Trigger 1: Organization Created

**When:** After a new organization is created  
**Service:** `OrganizationService.create()`  
**Billing Action:** Creates a Lago customer + starter subscription  
**Write-back:** Stores `lago_customer_id` in `organizations.settings` JSON  
**Billing Level:** Only if `BILLING_LEVEL=org` (default)

```typescript
// src/services/organization.service.ts
async create(data: any, request?: any) {
  const organization = await prisma.organizations.create({ data });
  
  // ✅ Fire-and-recover: never await, never throw
  this.syncOrgToBilling(organization).catch(logger.error);
  
  return organization;
}
```

### Trigger 2: Customer Created

**When:** After a new customer record is created  
**Service:** `CustomerService.create()`  
**Billing Action:** Creates a Lago customer + subscription (based on product)  
**Write-back:** Stores `lago_customer_id` in `customers.lago_customer_id`  
**Billing Level:** Only if `BILLING_LEVEL=customer` (marketplace model)

```typescript
// src/services/customer.service.ts
async create(data: any, request?: any) {
  const customer = await prisma.customers.create({ data });
  
  if (process.env.BILLING_LEVEL === 'customer') {
    this.syncCustomerToBilling(customer, data.org_id).catch(logger.error);
  }
  
  return customer;
}
```

### Trigger 3: Usage Events

**When:** After usage event(s) are written to `usage_events` table  
**Service:** `UsageService.createUsageEvent()` and `bulkCreateUsageEvents()`  
**Billing Action:** Forwards events to Lago for metering  
**Mapping:** Uses `METER_TO_LAGO` map to translate `meters.field` → Lago `event_code`  
**Always Active:** Runs for all billing levels

```typescript
// src/services/usage.service.ts
const METER_TO_LAGO = {
  'input_tokens':  { event_code: 'input_tokens',  prop_key: 'input_tokens'  },
  'output_tokens': { event_code: 'output_tokens', prop_key: 'output_tokens' },
  'count':         { event_code: 'api_calls'                                },
  'gpu_seconds':   { event_code: 'gpu_seconds',   prop_key: 'gpu_seconds'   },
  'storage_gb':    { event_code: 'storage_gb',    prop_key: 'storage_gb'    },
};

async createUsageEvent(orgId: string, data: any) {
  const event = await prisma.usage_events.create({ data });
  
  this.forwardEventToBilling(event, meter, orgId).catch(logger.error);
  
  return event;
}
```

### Trigger 4: Plan Change

**When:** After a customer's `product_id` is updated  
**Service:** `CustomerService.update()`  
**Billing Action:** Changes Lago subscription plan (handles proration)  
**Product Mapping:** Maps `products.name` → Lago `plan_code` (starter/pro/enterprise)

```typescript
// src/services/customer.service.ts
async update(id: string, data: any) {
  const existingCustomer = await this.findById(id);
  const updated = await prisma.customers.update({ where: { id }, data });
  
  if (data.product_id && data.product_id !== existingCustomer.product_id) {
    this.syncPlanChangeToBilling(updated).catch(logger.error);
  }
  
  return updated;
}
```

## File Changes Summary

### New Files Created

```
backend/
├── src/
│   └── integrations/
│       └── billing.client.ts          ← NEW: HTTP client for billing service
└── migrations/
    └── 20260407_add_lago_fields_to_customers.sql  ← NEW: DB migration
```

### Modified Files

```
backend/
├── prisma/
│   └── schema.prisma                  ← Added lago_* fields to customers model
├── src/
│   └── services/
│       ├── organization.service.ts    ← Added syncOrgToBilling()
│       ├── customer.service.ts        ← Added syncCustomerToBilling() & syncPlanChangeToBilling()
│       └── usage.service.ts           ← Added forwardEventToBilling() & forwardBatchEventsToBilling()
└── .env.example                       ← Added BILLING_SERVICE_* env vars
```

## Database Schema Changes

Added to `customers` table:

```sql
ALTER TABLE customers
  ADD COLUMN lago_customer_id  VARCHAR(255) DEFAULT NULL,
  ADD COLUMN lago_sync_status  VARCHAR(20)  DEFAULT 'pending',
  ADD COLUMN lago_synced_at    TIMESTAMP    DEFAULT NULL;

CREATE INDEX idx_customers_lago_customer_id ON customers (lago_customer_id);
CREATE INDEX idx_customers_lago_sync_status ON customers (lago_sync_status);
```

## Environment Variables

Add these to `.env`:

```env
# Billing Service Integration
BILLING_INTEGRATION_ENABLED=true
BILLING_SERVICE_URL=http://billing-service:4000
BILLING_SERVICE_API_KEY=<must-match-billing-service-INTERNAL_API_KEY>
BILLING_LEVEL=org
LAGO_WEBHOOK_SECRET=<lago-webhook-secret>
```

## BillingClient API

The `BillingClient` class in `src/integrations/billing.client.ts` provides these methods:

```typescript
import { getBillingClient } from '../integrations/billing.client';

const billing = getBillingClient();

// Create customer + subscription
await billing.createCustomer({
  internal_id: 'org-uuid-or-customer-uuid',
  org_id: 'org-uuid',
  name: 'Acme Corp',
  email: 'billing@acme.com',
  plan_code: 'starter',
});

// Push single usage event
await billing.pushEvent({
  internal_customer_id: 'org-uuid-or-customer-uuid',
  event_code: 'input_tokens',
  properties: { input_tokens: 1500 },
});

// Push batch events
await billing.pushBatchEvents({
  events: [/* array of events */],
});

// Update subscription plan
await billing.updateSubscription({
  internal_customer_id: 'org-uuid-or-customer-uuid',
  plan_code: 'pro',
});

// Terminate subscription
await billing.terminateSubscription('org-uuid-or-customer-uuid');

// Top up credits
await billing.topUpCredits('org-uuid-or-customer-uuid', 5000, 'USD');

// Get usage
await billing.getUsage('org-uuid-or-customer-uuid');

// Health check
const healthy = await billing.healthCheck();
```

## Meter → Lago Event Code Mapping

When adding new meters to the backend, update `METER_TO_LAGO` in `usage.service.ts`:

| Backend `meters.field` | Lago `event_code` | Lago `properties` key | Aggregation |
|------------------------|-------------------|-----------------------|-------------|
| `input_tokens`         | `input_tokens`    | `input_tokens`        | SUM         |
| `output_tokens`        | `output_tokens`   | `output_tokens`       | SUM         |
| `count`                | `api_calls`       | *(none)*              | COUNT       |
| `gpu_seconds`          | `gpu_seconds`     | `gpu_seconds`         | SUM         |
| `storage_gb`           | `storage_gb`      | `storage_gb`          | MAX         |

**Adding a new meter:**

1. Add entry to `METER_TO_LAGO` map
2. Create matching **Billable Metric** in Lago UI
3. Add metric to relevant Lago plans

## Error Handling

### Fire-and-Recover Pattern

```typescript
// ✅ CORRECT
const record = await prisma.someModel.create({ data });
this.syncToBilling(record).catch(logger.error);  // Never await!
return record;

// ❌ WRONG — never await billing inside transaction
await prisma.$transaction(async (tx) => {
  const record = await tx.someModel.create({ data });
  await billingClient.createCustomer(...);  // Throws → rollback
});
```

### Retry Strategy

- **Timeout:** 8 seconds per HTTP request
- **Billing Service Retries:** Handled by billing service's `sync_jobs` table (3 attempts, 5-min intervals)
- **Backend Logging:** All failures logged with `logger.error()` for monitoring/alerting

### Monitoring Failed Syncs

Query for customers that failed to sync:

```sql
SELECT id, name, email, lago_sync_status, lago_synced_at
FROM customers
WHERE lago_sync_status = 'failed'
   OR (lago_sync_status = 'pending' AND created_at < NOW() - INTERVAL '1 hour');
```

For organizations (if `BILLING_LEVEL=org`):

```sql
SELECT id, name, billing_email, settings->'lago_sync_status' as sync_status
FROM organizations
WHERE settings->>'lago_sync_status' = 'failed';
```

## Deployment Checklist

### Before First Deploy

- [ ] Billing service is running (`http://billing-service:4000/health` returns 200)
- [ ] `.env` variables are set (see above)
- [ ] `BILLING_SERVICE_API_KEY` matches `INTERNAL_API_KEY` in billing service
- [ ] Lago instance has 5 billable metrics configured (`input_tokens`, `output_tokens`, `api_calls`, `gpu_seconds`, `storage_gb`)
- [ ] Lago instance has 3 plans configured (`starter`, `pro`, `enterprise`)
- [ ] Database migration applied: `lago_customer_id`, `lago_sync_status`, `lago_synced_at` columns exist
- [ ] Prisma schema updated and generated: `npx prisma generate`

### Verification Steps

```bash
# 1. Create an organization
POST /api/v1/organizations
{
  "name": "Test Org",
  "slug": "test-org",
  "billing_email": "billing@test.com"
}
# → Check: organizations.settings should contain lago_customer_id

# 2. Create a customer (if BILLING_LEVEL=customer)
POST /api/v1/customers
{
  "name": "Test Customer",
  "email": "test@example.com",
  "product_id": "<pro-product-uuid>"
}
# → Check: customers.lago_customer_id should be populated

# 3. Push usage events
POST /api/v1/usage-events
{
  "meter_id": "<meter-uuid>",
  "event_type": "llm.inference",
  "event_value": 1500
}
# → Check: Billing service logs show event forwarded

# 4. Change plan
PATCH /api/v1/customers/<customer-id>
{
  "product_id": "<enterprise-product-uuid>"
}
# → Check: Billing service logs show subscription updated
```

## Security

- **Internal API Key:** Use a strong random key, rotate regularly
- **Network Isolation:** Run billing service in same VPC, restrict external access
- **Multi-Tenancy:** Always pass `org_id` in billing calls; billing service validates
- **Lago Webhooks:** Verify HMAC signature using `LAGO_WEBHOOK_SECRET`

## Troubleshooting

### Billing calls timing out

- Check billing service is reachable: `curl http://billing-service:4000/health`
- Check network latency between services
- Increase timeout in `BillingClient` (default 8s)

### Customers not syncing

- Check `lago_sync_status` column: `SELECT id, name, lago_sync_status FROM customers WHERE lago_sync_status != 'synced'`
- Check backend logs for errors: `grep "Billing sync failed" logs/app.log`
- Check billing service logs for failed API calls

### Events not appearing in Lago

- Verify `METER_TO_LAGO` mapping includes your meter field
- Check billing service logs for forwarding errors
- Verify Lago has matching billable metric configured with correct `event_code`

## Support

For issues related to:
- **Backend integration code:** Check backend logs, review service changes
- **Billing service:** Check billing service logs, verify API endpoints
- **Lago:** Check Lago UI, verify metrics/plans configuration

## Related Documentation

- [Billing Service README](../../billing%20service/README.md)
- [INTEGRATION_README.md](../../INTEGRATION_README.md)
- [METER_TO_LAGO Mapping](#meter--lago-event-code-mapping)
