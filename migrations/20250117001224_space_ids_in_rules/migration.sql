-- AlterTable
ALTER TABLE "AvailabilityRule" ADD COLUMN     "spaceIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
