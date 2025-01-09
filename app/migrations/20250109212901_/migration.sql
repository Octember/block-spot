/*
  Warnings:

  - You are about to drop the column `granularity` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `resourceId` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_resourceId_fkey";

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "granularity",
DROP COLUMN "resourceId",
ADD COLUMN     "description" TEXT;

-- DropTable
DROP TABLE "Resource";
