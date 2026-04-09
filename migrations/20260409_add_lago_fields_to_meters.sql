-- Add Lago billable metric fields to meters table
ALTER TABLE meters 
ADD COLUMN IF NOT EXISTS billable_metric_code VARCHAR(255),
ADD COLUMN IF NOT EXISTS billable_metric_description TEXT,
ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meters_billable_metric_code ON meters(billable_metric_code);
