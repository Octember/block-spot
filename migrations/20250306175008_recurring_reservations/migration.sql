-- CreateEnum
CREATE TYPE "RecurringReservationStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "isException" BOOLEAN DEFAULT false,
ADD COLUMN     "recurringReservationId" TEXT;

-- CreateTable
CREATE TABLE "OrganizationSchedulingConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "allowsRecurringReservations" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationSchedulingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringReservation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "interval" INTEGER NOT NULL,
    "endsOn" TIMESTAMP(3),
    "status" "RecurringReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "spaceId" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "RecurringReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSchedulingConfig_organizationId_key" ON "OrganizationSchedulingConfig"("organizationId");

-- AddForeignKey
ALTER TABLE "OrganizationSchedulingConfig" ADD CONSTRAINT "OrganizationSchedulingConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringReservation" ADD CONSTRAINT "RecurringReservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringReservation" ADD CONSTRAINT "RecurringReservation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringReservation" ADD CONSTRAINT "RecurringReservation_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_recurringReservationId_fkey" FOREIGN KEY ("recurringReservationId") REFERENCES "RecurringReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
