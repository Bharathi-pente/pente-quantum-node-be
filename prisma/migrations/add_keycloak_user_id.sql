-- Migration: Add keycloak_user_id to users table
-- This links Keycloak identity with your application users

-- Add keycloak_user_id column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS keycloak_user_id VARCHAR(255) UNIQUE;

-- Create index for fast lookups during every authenticated request
CREATE INDEX IF NOT EXISTS idx_users_keycloak_user_id ON users(keycloak_user_id);

-- Add comment for documentation
COMMENT ON COLUMN users.keycloak_user_id IS 'Keycloak UUID - links to Keycloak identity provider';
