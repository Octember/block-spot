/*
  Warnings:

  - You are about to drop the column `maxMinutes` on the `PaymentRule` table. All the data in the column will be lost.
  - You are about to drop the column `minMinutes` on the `PaymentRule` table. All the data in the column will be lost.
  - You are about to drop the column `requiredTags` on the `PaymentRule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PaymentRule" DROP COLUMN "maxMinutes",
DROP COLUMN "minMinutes",
DROP COLUMN "requiredTags";

-- CreateTable
CREATE TABLE "PriceCondition" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentRuleId" TEXT NOT NULL,
    "startTime" INTEGER,
    "endTime" INTEGER,
    "userTags" TEXT[],

    CONSTRAINT "PriceCondition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PriceCondition" ADD CONSTRAINT "PriceCondition_paymentRuleId_fkey" FOREIGN KEY ("paymentRuleId") REFERENCES "PaymentRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
