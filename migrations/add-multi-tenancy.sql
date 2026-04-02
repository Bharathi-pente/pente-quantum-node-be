-- QuantumBill Multi-Tenancy Migration
-- Adds Keycloak integration and org isolation to users table

BEGIN;

-- ============================================
-- 1. Add Keycloak Integration Columns
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS keycloak_user_id UUID,
ADD COLUMN IF NOT EXISTS keycloak_roles JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 2. Add Constraints
-- ============================================

-- Make keycloak_user_id unique (one Keycloak user = one DB user)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_keycloak_user_id_unique'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_keycloak_user_id_unique UNIQUE (keycloak_user_id);
    END IF;
END $$;

-- ============================================
-- 3. Create Performance Indexes
-- ============================================

-- Index for Keycloak user lookups (used on every authenticated request)
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON users(keycloak_user_id);

-- Index for org-based queries
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

-- Index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Composite index for org + status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_users_org_status ON users(org_id, status);

-- ============================================
-- 4. Allow NULL org_id for Super Admins
-- ============================================

-- Super admins (billing-admin) don't belong to a specific org
ALTER TABLE users 
ALTER COLUMN org_id DROP NOT NULL;

-- ============================================
-- 5. Add Column Comments
-- ============================================

COMMENT ON COLUMN users.keycloak_user_id IS 'UUID from Keycloak sub claim (JWT token). Used for SSO integration.';
COMMENT ON COLUMN users.keycloak_roles IS 'Cached array of Keycloak client roles (billing-admin, billing-org-admin, etc.) for quick access without token decode.';
COMMENT ON COLUMN users.org_id IS 'Organization ID. NULL for super admins who can access all orgs.';

-- ============================================
-- 6. Verify Existing Org-Related Indexes
-- ============================================

-- Ensure all org-scoped tables have proper indexes
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON customers(org_id);
CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(org_id);
CREATE INDEX IF NOT EXISTS idx_meters_org_id ON meters(org_id);
CREATE INDEX IF NOT EXISTS idx_roles_org_id ON roles(org_id);
CREATE INDEX IF NOT EXISTS idx_rate_cards_org_id ON rate_cards(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);

-- ============================================
-- 7. Add Audit Trigger for User Changes
-- ============================================

CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Log important user changes to audit_logs
        INSERT INTO audit_logs (
            org_id,
            actor,
            action,
            resource_label,
            resource_id,
            status,
            details,
            created_at
        )
        VALUES (
            NEW.org_id,
            COALESCE(current_setting('app.current_user', true), 'system'),
            'users.update',
            NEW.name || ' (' || NEW.email || ')',
            NEW.id,
            'success',
            jsonb_build_object(
                'changed_fields', jsonb_build_object(
                    'status', CASE WHEN OLD.status <> NEW.status THEN jsonb_build_object('old', OLD.status, 'new', NEW.status) ELSE NULL END,
                    'role_id', CASE WHEN OLD.role_id <> NEW.role_id THEN jsonb_build_object('old', OLD.role_id, 'new', NEW.role_id) ELSE NULL END,
                    'org_id', CASE WHEN OLD.org_id IS DISTINCT FROM NEW.org_id THEN jsonb_build_object('old', OLD.org_id, 'new', NEW.org_id) ELSE NULL END
                )
            ),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS user_audit_trigger ON users;
CREATE TRIGGER user_audit_trigger
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_user_changes();

-- ============================================
-- 8. Create Helper Functions
-- ============================================

-- Function to get user's organization name
CREATE OR REPLACE FUNCTION get_user_org_name(user_id UUID)
RETURNS VARCHAR AS $$
    SELECT o.name
    FROM users u
    JOIN organizations o ON u.org_id = o.id
    WHERE u.id = user_id;
$$ LANGUAGE sql STABLE;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(keycloak_id UUID)
RETURNS BOOLEAN AS $$
    SELECT keycloak_roles @> '["billing-admin"]'::jsonb
    FROM users
    WHERE keycloak_user_id = keycloak_id;
$$ LANGUAGE sql STABLE;

COMMIT;

-- ============================================
-- Verification Queries
-- ============================================

-- Verify migration was successful
DO $$
DECLARE
    col_count INTEGER;
    idx_count INTEGER;
BEGIN
    -- Check if columns exist
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name IN ('keycloak_user_id', 'keycloak_roles');

    -- Check if indexes exist
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE tablename = 'users'
    AND indexname IN ('idx_users_keycloak_id', 'idx_users_org_id');

    RAISE NOTICE '✓ Migration complete!';
    RAISE NOTICE '  - New columns added: %', col_count;
    RAISE NOTICE '  - New indexes created: %', idx_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update backend middleware to use keycloak_user_id';
    RAISE NOTICE '2. Implement org filtering in controllers';
    RAISE NOTICE '3. Test multi-tenancy with different users';
END $$;
