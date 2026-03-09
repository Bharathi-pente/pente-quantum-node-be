# Dunning Temporal Workflow Integration Guide

## Overview

The dunning system automatically manages overdue invoice collections using Temporal workflows. This guide explains how dunning policies connect to Temporal workflows and how to test the complete flow.

## Architecture

### Components

1. **Dunning Policies** - Define email templates and escalation steps
2. **Temporal Workflows** - Orchestrate the automated dunning process
3. **Temporal Worker** - Executes workflow activities (send emails, check payments, etc.)
4. **Dunning Scheduler** - Automatically starts workflows for overdue invoices

### How It Works

```
Overdue Invoice → Dunning Scheduler → Temporal Workflow → Activities (Email, Escalate, etc.)
                       ↓                      ↓
                  Policy + Steps        Worker Executes
```

## Important: Policy Creation ≠ Workflow Execution

**Creating a dunning policy does NOT automatically start workflows.** Workflows must be explicitly triggered for specific overdue invoices.

### Triggering Workflows

There are 3 ways to trigger dunning workflows:

#### 1. Automatic Scheduler (Recommended for Production)

Enable the automatic scheduler in `.env`:

```env
ENABLE_DUNNING_SCHEDULER=true
DUNNING_SCHEDULER_INTERVAL=60  # Check every 60 minutes
```

Restart your backend server. The scheduler will:
- Check for overdue invoices every N minutes
- Find the default dunning policy for each invoice's organization
- Automatically start workflows for unpaid invoices

#### 2. Manual API Trigger (Good for Testing)

Trigger dunning for all overdue invoices via API:

```bash
curl -X POST 'http://localhost:5000/api/v1/dunning/process-overdue' \
  -H "Authorization: Bearer $TOKEN"
```

This endpoint:
- Scans all overdue invoices
- Starts workflows using the default policy
- Returns success/failure count

#### 3. Manual Script (Good for Cron Jobs)

Run the script manually or via cron:

```bash
cd backend
node scripts/start-dunning-workflows.js
```

Or add to cron (Linux):
```cron
0 */6 * * * cd /path/to/backend && node scripts/start-dunning-workflows.js
```

## Complete Test Flow

### Prerequisites

1. **Temporal Server Running**
   ```bash
   # From pente_temporal_setup/
   docker-compose up -d
   ```
   - Temporal UI: http://localhost:8080
   - Temporal Server: localhost:7233

2. **Worker Running**
   ```bash
   cd backend
   npm run dev:temporal
   ```
   Should see: "Starting Temporal worker for dunning workflows..."

3. **Backend Server Running**
   ```bash
   cd backend
   npm run dev
   ```

### Step-by-Step Test

#### 1. Create Email Template

```bash
curl -X POST 'http://localhost:5000/api/v1/email-templates' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payment Reminder",
    "template_id": "payment_reminder",
    "subject": "Invoice {{invoice_number}} is overdue",
    "html_content": "<p>Hi {{customer_name}}, your invoice {{invoice_number}} for ${{amount}} is overdue.</p>",
    "text_content": "Hi {{customer_name}}, invoice {{invoice_number}} is overdue."
  }'
```

#### 2. Create Dunning Policy

```bash
curl -X POST 'http://localhost:5000/api/v1/dunning/policies' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Default Overdue Policy",
    "is_default": true,
    "status": "active"
  }'
```

Save the returned `id` as `POLICY_ID`.

#### 3. Add Dunning Steps

**Step 1: Immediate reminder**
```bash
curl -X POST 'http://localhost:5000/api/v1/dunning/steps' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "policy_id": "POLICY_ID",
    "day_offset": 0,
    "action": "email",
    "template_name": "payment_reminder",
    "subject": "Payment Reminder",
    "assignee": "",
    "escalate_to": "",
    "sort_order": 0
  }'
```

**Step 2: 7-day follow-up**
```bash
curl -X POST 'http://localhost:5000/api/v1/dunning/steps' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "policy_id": "POLICY_ID",
    "day_offset": 7,
    "action": "email",
    "template_name": "payment_reminder",
    "subject": "Final Payment Reminder",
    "assignee": "",
    "escalate_to": "",
    "sort_order": 1
  }'
```

#### 4. Create or Find Overdue Invoice

Check for existing overdue invoices:
```bash
node scripts/check-overdue-invoices.js
```

Or create a test invoice with a past due date via API or UI.

#### 5. Trigger Dunning Process

**Option A: Trigger via API (Recommended for Testing)**
```bash
curl -X POST 'http://localhost:5000/api/v1/dunning/process-overdue' \
  -H "Authorization: Bearer $TOKEN"
```

**Option B: Trigger via Script**
```bash
node scripts/start-dunning-workflows.js
```

#### 6. Verify Workflow in Temporal UI

1. Open http://localhost:8080
2. Ensure Namespace is `default` (top-left)
3. Search for workflows with ID prefix `dunning-`
4. Click on a workflow to see:
   - Execution history
   - Current status
   - Activity results

#### 7. Monitor Worker Logs

Check the worker terminal for activity logs:
```
2026-03-06T... [INFO] Sending dunning email { invoiceNumber: 'INV-1001', ... }
2026-03-06T... [INFO] Dunning email sent successfully { ... }
```

## Troubleshooting

### No Workflows Appearing in UI

**Cause**: Workflows not started yet
**Solution**: Run the process-overdue API or script (step 5 above)

### Worker Not Executing Activities

**Symptoms**: Workflows show in UI but stuck in "Running" without progress
**Causes**:
1. Worker not running → Start with `npm run dev:temporal`
2. Wrong taskQueue → Worker must use `dunning-queue`
3. Namespace mismatch → Check worker/client use `default` namespace

### Workflows Fail Immediately

**Check**:
1. Backend logs for errors when starting workflow
2. Worker logs for activity failures
3. Temporal UI → Workflow → "Events" → Look for errors

### Common Errors

**"Dunning policy not found"**
- Ensure policy exists and is marked `is_default: true` or `status: active`
- Check policy has steps defined

**"No SMTP configuration"**
- Set SMTP environment variables in `.env`:
  ```env
  SMTP_HOST=smtp.example.com
  SMTP_PORT=587
  SMTP_USER=user@example.com
  SMTP_PASSWORD=password
  SMTP_FROM=noreply@example.com
  ```

**"Customer email not found"**
- Ensure invoices have associated customers with valid email addresses

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/email-templates` | POST | Create email template |
| `/dunning/policies` | POST | Create dunning policy |
| `/dunning/steps` | POST | Add step to policy |
| `/dunning/process-overdue` | POST | **Trigger workflows for all overdue invoices** |
| `/dunning/workflows/start` | POST | Start workflow for specific invoice |
| `/dunning/workflows/{id}/status` | GET | Get workflow status |
| `/dunning/workflows/{id}/query` | GET | Query workflow details |
| `/dunning/workflows/{id}/signal` | POST | Send signal (pause/resume/cancel) |

## Environment Variables

```env
# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default

# Automatic Dunning Scheduler
ENABLE_DUNNING_SCHEDULER=true
DUNNING_SCHEDULER_INTERVAL=60  # minutes

# SMTP Configuration (required for email activities)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

## Production Recommendations

1. **Enable Automatic Scheduler**
   - Set `ENABLE_DUNNING_SCHEDULER=true`
   - Run every 1-6 hours depending on business needs

2. **Monitor Workflows**
   - Set up alerts for failed workflows
   - Review Temporal UI dashboard regularly

3. **Email Rate Limiting**
   - Consider rate limits in SMTP configuration
   - Implement backoff/retry in activities

4. **Graceful Degradation**
   - If SMTP fails, workflows should log errors but not crash
   - Consider alternative notification methods (webhooks, etc.)

## Key Differences from Expectations

❌ **Misconception**: Creating a policy automatically starts workflows
✅ **Reality**: Policies are templates. Workflows must be triggered for specific invoices.

❌ **Misconception**: Workflows run when invoices become overdue
✅ **Reality**: Use the scheduler or manual trigger to start workflows.

❌ **Misconception**: Worker starts workflows
✅ **Reality**: Worker executes workflow activities. Backend/scheduler starts workflows.

## Next Steps

1. ✅ Create email templates
2. ✅ Create dunning policies with steps
3. ✅ Start Temporal worker
4. ⚠️ **Enable scheduler OR manually trigger dunning** ← YOU ARE HERE
5. ✅ Monitor workflows in Temporal UI
6. ✅ Verify emails are sent (check SMTP logs)

## Quick Commands Reference

```bash
# Check overdue invoices
node scripts/check-overdue-invoices.js

# Trigger dunning for all overdue (manual)
node scripts/start-dunning-workflows.js

# Start worker
npm run dev:temporal

# Check worker is registered
# → Look for "Worker state changed { state: 'RUNNING' }" in logs

# View Temporal UI
open http://localhost:8080
```

## Support

For issues:
1. Check backend logs: `npm run dev` output
2. Check worker logs: `npm run dev:temporal` output
3. Check Temporal UI: http://localhost:8080
4. Review this guide's troubleshooting section
