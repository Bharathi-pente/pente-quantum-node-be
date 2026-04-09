-- Migration: Add Lago billing integration fields to customers table
-- Date: 2026-04-07
-- Description: Adds lago_customer_id, lago_sync_status, and lago_synced_at fields

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS lago_customer_id  VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lago_sync_status  VARCHAR(20)  DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS lago_synced_at    TIMESTAMP    DEFAULT NULL;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_customers_lago_customer_id
  ON customers (lago_customer_id)
  WHERE lago_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_lago_sync_status
  ON customers (lago_sync_status);

-- Add comments for documentation
COMMENT ON COLUMN customers.lago_customer_id IS 'Lago customer UUID from billing service';
COMMENT ON COLUMN customers.lago_sync_status IS 'Sync status: pending, synced, failed';
COMMENT ON COLUMN customers.lago_synced_at IS 'Timestamp when last successfully synced to billing service';
