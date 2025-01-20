/*
  Warnings:

  - The `currentStep` column on the `OnboardingState` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "OnboardingState" ADD COLUMN     "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "currentStep",
ADD COLUMN     "currentStep" TEXT NOT NULL DEFAULT 'Welcome';

-- DropEnum
DROP TYPE "OnboardingStep";
