/*
  Warnings:

  - You are about to drop the column `displayEndHour` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the column `displayStartHour` on the `Venue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Venue" DROP COLUMN "displayEndHour",
DROP COLUMN "displayStartHour",
ADD COLUMN     "displayEnd" INTEGER NOT NULL DEFAULT 1080,
ADD COLUMN     "displayStart" INTEGER NOT NULL DEFAULT 480;
