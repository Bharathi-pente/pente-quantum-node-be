-- AlterTable: Make org_id optional in products table
-- Drop existing unique constraint on (org_id, name)
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_org_id_name_key";

-- Make org_id nullable
ALTER TABLE "products" ALTER COLUMN "org_id" DROP NOT NULL;

-- Add new unique constraint on (created_by, name) like meters
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_name_key" UNIQUE ("created_by", "name");
