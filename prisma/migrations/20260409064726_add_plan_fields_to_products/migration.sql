-- AlterTable
ALTER TABLE "products" ADD COLUMN     "amount_cents" INTEGER,
ADD COLUMN     "amount_currency" VARCHAR(3) DEFAULT 'USD',
ADD COLUMN     "interval" VARCHAR(50),
ADD COLUMN     "pay_in_advance" BOOLEAN DEFAULT true,
ADD COLUMN     "plan_code" VARCHAR(255),
ADD COLUMN     "plan_description" TEXT;
