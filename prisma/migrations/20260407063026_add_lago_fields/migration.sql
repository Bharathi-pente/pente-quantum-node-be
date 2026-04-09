-- DropIndex
DROP INDEX "products_org_id_name_key";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "lago_customer_id" VARCHAR(255),
ADD COLUMN     "lago_sync_status" VARCHAR(20) DEFAULT 'pending',
ADD COLUMN     "lago_synced_at" TIMESTAMP(6);

-- CreateIndex
CREATE INDEX "idx_customers_lago_customer_id" ON "customers"("lago_customer_id");

-- CreateIndex
CREATE INDEX "idx_customers_lago_sync_status" ON "customers"("lago_sync_status");
