/*
  Warnings:

  - Added the required column `created_by` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "created_by" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "idx_products_created_by" ON "products"("created_by");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
