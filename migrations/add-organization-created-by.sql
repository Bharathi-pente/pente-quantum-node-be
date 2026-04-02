-- Add created_by column to organizations table
-- Run this manually in your database

BEGIN;

-- Add created_by column (reference to user who created the org)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add foreign key constraint
ALTER TABLE organizations
ADD CONSTRAINT fk_organizations_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

-- Add comment
COMMENT ON COLUMN organizations.created_by IS 'Reference to the user who created this organization';

COMMIT;