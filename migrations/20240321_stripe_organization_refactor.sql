-- Step 1: Copy existing stripe data from User to Organization
UPDATE "Organization" o
SET 
  "stripeCustomerId" = u."paymentProcessorUserId",
  "subscriptionStatus" = u."subscriptionStatus",
  "subscriptionPlanId" = u."subscriptionPlan"
FROM "User" u
JOIN "OrganizationUser" ou ON u.id = ou."userId"
WHERE ou.role = 'OWNER'
  AND u."paymentProcessorUserId" IS NOT NULL
  AND o.id = ou."organizationId";

-- Step 2: Remove stripe-related columns from User table
ALTER TABLE "User"
  DROP COLUMN IF EXISTS "paymentProcessorUserId",
  DROP COLUMN IF EXISTS "subscriptionStatus",
  DROP COLUMN IF EXISTS "subscriptionPlan",
  DROP COLUMN IF EXISTS "datePaid",
  DROP COLUMN IF EXISTS "credits";

-- Step 3: Ensure Organization has all necessary stripe-related columns
ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionPlanId" TEXT,
  ADD COLUMN IF NOT EXISTS "datePaid" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "credits" INTEGER DEFAULT 3; 