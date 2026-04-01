-- Seed Usage Limits Data
-- Run this in Prisma Studio SQL tab or connect directly to PostgreSQL

-- First, create products if they don't exist
INSERT INTO products (org_id, name, description, base_price, status)
SELECT 'b86756c3-5f8c-45ac-9479-5095bd84aa27', name, description, base_price, 'active'
FROM (VALUES 
  ('Starter Plan', 'Basic plan for small teams', 29.99),
  ('Professional Plan', 'For growing businesses', 99.99),
  ('Enterprise Plan', 'Unlimited resources', 299.99),
  ('API Access', 'API usage tier', 49.99),
  ('Storage Plan', 'Cloud storage service', 19.99)
) AS new_products(name, description, base_price)
WHERE NOT EXISTS (
  SELECT 1 FROM products 
  WHERE org_id = 'b86756c3-5f8c-45ac-9479-5095bd84aa27' 
  AND products.name = new_products.name
);

-- Create meters if they don't exist
INSERT INTO meters (org_id, name, event_type, aggregation, field, status)
SELECT 'b86756c3-5f8c-45ac-9479-5095bd84aa27', name, event_type, aggregation, field, 'active'
FROM (VALUES 
  ('API Calls', 'api.call', 'count', 'requests'),
  ('Storage Used', 'storage.usage', 'sum', 'bytes'),
  ('Users Active', 'user.active', 'unique', 'user_id'),
  ('Compute Hours', 'compute.usage', 'sum', 'hours'),
  ('Bandwidth', 'bandwidth.transfer', 'sum', 'megabytes')
) AS new_meters(name, event_type, aggregation, field)
WHERE NOT EXISTS (
  SELECT 1 FROM meters 
  WHERE org_id = 'b86756c3-5f8c-45ac-9479-5095bd84aa27' 
  AND meters.name = new_meters.name
);

-- Now create usage limits with product-meter combinations
INSERT INTO usage_limits (product_id, meter_id, limit_type, limit_value, period, warning_threshold_pct, status)
SELECT 
  p.id as product_id,
  m.id as meter_id,
  limits.limit_type,
  limits.limit_value,
  limits.period,
  limits.warning_threshold_pct,
  'active' as status
FROM (VALUES 
  ('Starter Plan', 'API Calls', 'hard', 10000, 'monthly', 80),
  ('Starter Plan', 'Storage Used', 'soft', 50000000000, 'monthly', 90),
  ('Professional Plan', 'API Calls', 'hard', 100000, 'monthly', 85),
  ('Professional Plan', 'Users Active', 'soft', 50, 'monthly', 80),
  ('Enterprise Plan', 'API Calls', 'tiered', 1000000, 'monthly', 90),
  ('Enterprise Plan', 'Compute Hours', 'hard', 10000, 'monthly', 85),
  ('API Access', 'API Calls', 'hard', 50000, 'monthly', 80),
  ('Storage Plan', 'Storage Used', 'soft', 100000000000, 'monthly', 85)
) AS limits(product_name, meter_name, limit_type, limit_value, period, warning_threshold_pct)
JOIN products p ON p.name = limits.product_name AND p.org_id = 'b86756c3-5f8c-45ac-9479-5095bd84aa27'
JOIN meters m ON m.name = limits.meter_name AND m.org_id = 'b86756c3-5f8c-45ac-9479-5095bd84aa27'
WHERE NOT EXISTS (
  SELECT 1 FROM usage_limits ul
  WHERE ul.product_id = p.id AND ul.meter_id = m.id
);

-- Verify the data
SELECT 
  p.name as product,
  m.name as meter,
  ul.limit_type,
  ul.limit_value,
  ul.period,
  ul.warning_threshold_pct,
  ul.status
FROM usage_limits ul
JOIN products p ON ul.product_id = p.id
JOIN meters m ON ul.meter_id = m.id
WHERE p.org_id = 'b86756c3-5f8c-45ac-9479-5095bd84aa27'
ORDER BY p.name, m.name;
