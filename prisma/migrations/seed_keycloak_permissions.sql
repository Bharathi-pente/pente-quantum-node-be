-- Seed data for Keycloak role permissions
-- This script creates permissions for the 3 Keycloak roles: billing-admin, billing-manager, billing-viewer

-- NOTE: Replace <org-id>, <billing-admin-role-id>, <billing-manager-role-id>, <billing-viewer-role-id>
-- with actual IDs from your database before running

-- ═══════════════════════════════════════════════════════════════════
-- BILLING-ADMIN PERMISSIONS (Full Access)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO role_permissions (id, role_id, permission, created_at, updated_at) VALUES
  (gen_random_uuid(), '<billing-admin-role-id>', 'organizations.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'organizations.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'users.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'users.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'users.delete', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'roles.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'roles.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'customers.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'customers.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'customers.delete', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'contracts.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'contracts.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'invoices.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'invoices.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'payments.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'payments.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'credits.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'credits.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'products.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'products.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'meters.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'meters.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'rate_cards.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'rate_cards.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'alerts.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'alerts.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'reports.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'reports.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'webhooks.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'webhooks.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'api_keys.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'api_keys.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'audit_logs.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'anomalies.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'anomalies.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'gdpr_requests.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'gdpr_requests.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'compliance.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'integrations.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-admin-role-id>', 'integrations.write', NOW(), NOW())
ON CONFLICT (role_id, permission) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- BILLING-MANAGER PERMISSIONS (Read + Limited Write)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO role_permissions (id, role_id, permission, created_at, updated_at) VALUES
  (gen_random_uuid(), '<billing-manager-role-id>', 'organizations.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'customers.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'customers.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'contracts.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'contracts.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'invoices.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'invoices.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'payments.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'credits.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'credits.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'products.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'meters.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'rate_cards.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'alerts.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'alerts.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'reports.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'reports.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'webhooks.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'webhooks.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'api_keys.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'api_keys.write', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'audit_logs.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'anomalies.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'integrations.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-manager-role-id>', 'integrations.write', NOW(), NOW())
ON CONFLICT (role_id, permission) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- BILLING-VIEWER PERMISSIONS (Read-Only)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO role_permissions (id, role_id, permission, created_at, updated_at) VALUES
  (gen_random_uuid(), '<billing-viewer-role-id>', 'organizations.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'customers.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'contracts.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'invoices.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'credits.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'products.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'meters.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'rate_cards.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'alerts.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'reports.read', NOW(), NOW()),
  (gen_random_uuid(), '<billing-viewer-role-id>', 'anomalies.read', NOW(), NOW())
ON CONFLICT (role_id, permission) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════

-- Count permissions per role
SELECT 
  r.name as role_name,
  COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name IN ('billing-admin', 'billing-manager', 'billing-viewer')
GROUP BY r.name
ORDER BY r.name;

-- View all permissions for a specific role
-- SELECT 
--   r.name as role_name,
--   rp.permission
-- FROM roles r
-- JOIN role_permissions rp ON r.id = rp.role_id
-- WHERE r.name = 'billing-admin'
-- ORDER BY rp.permission;
