/*
  Warnings:

  - You are about to drop the column `maxHoursAllowed` on the `PaymentRule` table. All the data in the column will be lost.
  - You are about to drop the column `minHoursRequired` on the `PaymentRule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PaymentRule" DROP COLUMN "maxHoursAllowed",
DROP COLUMN "minHoursRequired",
ADD COLUMN     "maxMinutes" INTEGER,
ADD COLUMN     "minMinutes" INTEGER;
