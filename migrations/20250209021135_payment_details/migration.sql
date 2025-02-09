-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('BASE_RATE', 'MULTIPLIER', 'DISCOUNT', 'FLAT_FEE');

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reservationId" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRule" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "spaceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" INTEGER NOT NULL,
    "ruleType" "RuleType" NOT NULL,
    "pricePerHour" DECIMAL(65,30),
    "multiplier" DECIMAL(65,30),
    "discountRate" DECIMAL(65,30),
    "depositAmount" DECIMAL(65,30),
    "startTime" INTEGER,
    "endTime" INTEGER,
    "daysOfWeek" INTEGER[],
    "minHoursRequired" INTEGER,
    "maxHoursAllowed" INTEGER,
    "requiredTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reservationId_key" ON "Payment"("reservationId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRule" ADD CONSTRAINT "PaymentRule_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
