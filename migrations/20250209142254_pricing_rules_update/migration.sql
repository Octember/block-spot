/*
  Warnings:

  - You are about to drop the column `depositAmount` on the `PaymentRule` table. All the data in the column will be lost.
  - You are about to drop the column `maxHoursAllowed` on the `PaymentRule` table. All the data in the column will be lost.
  - You are about to drop the column `minHoursRequired` on the `PaymentRule` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerHour` on the `PaymentRule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PaymentRule" DROP COLUMN "depositAmount",
DROP COLUMN "maxHoursAllowed",
DROP COLUMN "minHoursRequired",
DROP COLUMN "pricePerHour",
ADD COLUMN     "pricePerPeriod" DECIMAL(65,30);
