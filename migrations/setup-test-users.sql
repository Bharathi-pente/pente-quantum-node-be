-- Setup Test Data for Multi-Tenancy
-- Creates two organizations and links your existing Keycloak users to them

BEGIN;

-- ========================================
-- 1. Create Two Test Organizations
-- ========================================

INSERT INTO organizations (id, name, slug, billing_email, status, settings, created_at, updated_at)
VALUES 
  (
    'org-bharathi-001',
    'Bharathi Organization',
    'bharathi-org',
    'bharathipenteai@gmail.com',
    'active',
    '{"currency": "USD", "timezone": "UTC"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'org-admin-002',
    'Admin Test Organization', 
    'admin-test-org',
    'admin@test.com',
    'active',
    '{"currency": "USD", "timezone": "UTC"}'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. Create/Update Users and Link to Organizations
-- ========================================

-- User 1: bharathipenteai@gmail.com → Bharathi Organization
INSERT INTO users (id, org_id, name, email, status, avatar_initials, created_at, last_active_at)
VALUES (
  gen_random_uuid(),
  'org-bharathi-001',
  'Bharathi',
  'bharathipenteai@gmail.com',
  'active',
  'B',
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  org_id = 'org-bharathi-001',
  status = 'active',
  name = COALESCE(users.name, 'Bharathi'),
  last_active_at = NOW();

-- User 2: admin@test.com → Admin Test Organization  
INSERT INTO users (id, org_id, name, email, status, avatar_initials, created_at, last_active_at)
VALUES (
  gen_random_uuid(),
  'org-admin-002',
  'Admin User',
  'admin@test.com',
  'active',
  'AU',
  NOW(),
  NOW()
)
ON CONFLICT (email)
DO UPDATE SET
  org_id = 'org-admin-002',
  status = 'active',
  name = COALESCE(users.name, 'Admin User'),
  last_active_at = NOW();

-- ========================================
-- 3. Create Sample Customers for Each Org
-- ========================================

-- Customers for Bharathi Organization
INSERT INTO customers (id, org_id, name, email, status, mrr, credit_balance, health_score, logo_initials, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'org-bharathi-001',
    'Bharathi Customer 1',
    'customer1@bharathi.com',
    'active',
    100.00,
    0,
    95,
    'BC1',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'org-bharathi-001',
    'Bharathi Customer 2',
    'customer2@bharathi.com',
    'active',
    200.00,
    0,
    90,
    'BC2',
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Customers for Admin Test Organization
INSERT INTO customers (id, org_id, name, email, status, mrr, credit_balance, health_score, logo_initials, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'org-admin-002',
    'Admin Customer 1',
    'customer1@admin.com',
    'active',
    150.00,
    0,
    85,
    'AC1',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'org-admin-002',
    'Admin Customer 2',
    'customer2@admin.com',
    'active',
    250.00,
    0,
    88,
    'AC2',
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

COMMIT;

-- ========================================
-- 4. Verify Setup
-- ========================================

-- Show organizations
SELECT id, name, slug, billing_email, status 
FROM organizations 
ORDER BY name;

-- Show users and their organizations
SELECT 
  u.id,
  u.email,
  u.name,
  u.org_id,
  o.name as organization_name,
  u.status,
  u.keycloak_user_id
FROM users u
LEFT JOIN organizations o ON u.org_id = o.id
WHERE u.email IN ('bharathipenteai@gmail.com', 'admin@test.com')
ORDER BY u.email;

-- Show customers per organization
SELECT 
  o.name as organization,
  COUNT(c.id) as customer_count,
  SUM(c.mrr) as total_mrr
FROM organizations o
LEFT JOIN customers c ON c.org_id = o.id
WHERE o.id IN ('org-bharathi-001', 'org-admin-002')
GROUP BY o.id, o.name
ORDER BY o.name;

-- Show all customers with org info
SELECT 
  c.name as customer_name,
  c.email,
  o.name as organization,
  c.mrr,
  c.status
FROM customers c
JOIN organizations o ON c.org_id = o.id
WHERE o.id IN ('org-bharathi-001', 'org-admin-002')
ORDER BY o.name, c.name;
