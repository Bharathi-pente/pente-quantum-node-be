-- Create Test Overdue Invoices for Dunning Demo
-- This script creates or updates invoices to be overdue so you can test the dunning feature

-- Option 1: Update existing invoices to be overdue
-- This finds the first 3 pending invoices and makes them overdue

UPDATE invoices
SET 
  due_date = CURRENT_DATE - INTERVAL '10 days',
  status = 'pending',
  dunning_step = NULL
WHERE id IN (
  SELECT id 
  FROM invoices 
  WHERE status IN ('pending', 'draft')
  LIMIT 3
);

-- Option 2: Get customers and create new overdue invoices
-- Run this query first to get customer IDs:
-- SELECT id, name, email, org_id FROM customers WHERE org_id = 'YOUR_ORG_ID' LIMIT 3;

/*
-- Then create overdue invoices for those customers:
INSERT INTO invoices (
  invoice_number,
  customer_id,
  status,
  issue_date,
  due_date,
  subtotal,
  tax_amount,
  tax_rate,
  total,
  currency,
  dunning_step
) VALUES
(
  'INV-OVERDUE-001',
  'CUSTOMER_ID_1',  -- Replace with actual customer ID
  'pending',
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '15 days',
  1500.00,
  135.00,
  0.09,
  1635.00,
  'USD',
  0
),
(
  'INV-OVERDUE-002',
  'CUSTOMER_ID_2',  -- Replace with actual customer ID
  'pending',
  CURRENT_DATE - INTERVAL '20 days',
  CURRENT_DATE - INTERVAL '5 days',
  2800.00,
  252.00,
  0.09,
  3052.00,
  'USD',
  0
),
(
  'INV-OVERDUE-003',
  'CUSTOMER_ID_3',  -- Replace with actual customer ID
  'pending',
  CURRENT_DATE - INTERVAL '45 days',
  CURRENT_DATE - INTERVAL '30 days',
  890.00,
  80.10,
  0.09,
  970.10,
  'USD',
  1
);
*/

-- Option 3: View current overdue invoices
SELECT 
  i.id,
  i.invoice_number,
  i.status,
  i.due_date,
  i.total,
  i.dunning_step,
  c.name as customer_name,
  c.email as customer_email,
  c.org_id,
  CURRENT_DATE - i.due_date AS days_overdue
FROM 
  invoices i
  INNER JOIN customers c ON i.customer_id = c.id
WHERE 
  i.status IN ('pending', 'overdue')
  AND i.due_date < CURRENT_DATE
ORDER BY 
  i.due_date ASC;

-- Option 4: Check invoice counts by status
SELECT 
  status,
  COUNT(*) as count,
  SUM(total) as total_amount
FROM 
  invoices
GROUP BY 
  status
ORDER BY 
  count DESC;
