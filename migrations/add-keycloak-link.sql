-- Add Keycloak integration columns to users table
-- Run this manually in your database

BEGIN;

-- Add keycloak_user_id column (unique identifier from Keycloak)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS keycloak_user_id UUID UNIQUE;

-- Add keycloak_roles column (cache of Keycloak roles)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS keycloak_roles JSONB DEFAULT '[]'::jsonb;

-- Make org_id nullable for super admins
ALTER TABLE users 
ALTER COLUMN org_id DROP NOT NULL;

-- Create index for faster Keycloak user lookups
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON users(keycloak_user_id);

-- Add comments
COMMENT ON COLUMN users.keycloak_user_id IS 'UUID from Keycloak sub claim (JWT token)';
COMMENT ON COLUMN users.keycloak_roles IS 'Cached Keycloak client roles for quick access';

COMMIT;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('keycloak_user_id', 'keycloak_roles', 'org_id')
ORDER BY column_name;
