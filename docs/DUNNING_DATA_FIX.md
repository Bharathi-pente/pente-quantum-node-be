# Active Dunning & Customers in Dunning Process - Fix Summary

## Issue
The "Customers in Dunning Process" section was not displaying any customers, even though email templates and dunning policies were created.

## Root Cause
The backend `getOverdueInvoices` service was looking for invoices with `status = 'overdue'`, but:
1. Invoices are created with status `'pending'` and stay in that status even after the due date passes
2. There's no automatic job updating invoice status from `'pending'` to `'overdue'` based on due dates
3. The dunning scheduler also looks for `status = 'pending'` invoices with past due dates

This mismatch meant no invoices were returned by the API.

## Fix Applied

### Backend Changes

**File: `backend/src/services/dunning.service.ts`**

Updated `getOverdueInvoices()` to:
- Query invoices with status `'pending'` OR `'overdue'`
- Filter by due date < current date
- Return formatted data with customer information properly mapped:
  - `customerName` from `customers.name`
  - `number` from `invoice_number`
  - `total` from invoice total
  - `dunning_step` from invoice dunning_step (defaults to 0)

### Frontend Data Flow
The frontend already correctly uses:
- `invoice.customerName` to display customer name
- `invoice.number` for invoice number
- `invoice.dueDate` for due date
- `invoice.total` for amount
- `invoice.dunning_step` for step display (Step X of 4)

## How It Works Now

1. **Invoice Creation**: Invoices are created with status `'pending'`
2. **Overdue Detection**: Backend API `/dunning/overdue-invoices` returns all `'pending'` invoices past their due date
3. **Display**: Frontend "Customers in Dunning Process" section shows these invoices with:
   - Customer name
   - Invoice number and due date
   - Total amount
   - Current dunning step
   - Action buttons (Send Reminder, Call Customer, Pause Dunning)

4. **Workflow Trigger**: Use one of these methods to start dunning workflows:
   - Manual API: `POST /api/v1/dunning/process-overdue`
   - Manual script: `npm run dunning:start`
   - Auto-scheduler: Set `ENABLE_DUNNING_SCHEDULER=true` in `.env`

## Testing Steps

1. **Create a test overdue invoice**:
   - Create invoice with due_date in the past and status='pending'
   - OR update existing invoice: `UPDATE invoices SET due_date = '2026-01-01', status='pending' WHERE id='...'`

2. **Verify in UI**:
   - Navigate to http://localhost:5173/org/dunning
   - Click "Active Dunning" tab
   - Should see:
     - "In Dunning" metric showing count
     - "Customers in Dunning Process" section with invoice cards
     - Each card showing customer name, invoice #, due date, amount, step

3. **Trigger dunning workflow**:
   ```bash
   cd backend
   npm run dunning:start
   ```
   - OR via API:
   ```bash
   curl -X POST 'http://localhost:5000/api/v1/dunning/process-overdue' \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Monitor in Temporal UI**:
   - Open http://localhost:8080
   - Namespace: `default`
   - Search: `dunning-`
   - Should see workflows for each overdue invoice

## API Response Format

**GET /api/v1/dunning/overdue-invoices** now returns:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "number": "INV-2024-001",
      "customerId": "uuid",
      "customerName": "TechCorp AI",
      "customerEmail": "billing@techcorp.ai",
      "status": "pending",
      "issueDate": "2024-01-01T00:00:00.000Z",
      "dueDate": "2024-01-31T00:00:00.000Z",
      "total": 1234.56,
      "currency": "USD",
      "dunning_step": 0,
      "notes": ""
    }
  ]
}
```

## Related Files
- Backend: `backend/src/services/dunning.service.ts`
- Frontend: `pente_quantum_fe/src/pages/org/Dunning.tsx`
- API Service: `pente_quantum_fe/src/services/org.service.ts`
- Scheduler: `backend/src/services/dunning.scheduler.service.ts`

## Next Steps
- Create test invoices with past due dates to see the UI populated
- Run the dunning workflow trigger to see Temporal workflows in action
- Monitor dunning step progression in the "Active Dunning" tab
