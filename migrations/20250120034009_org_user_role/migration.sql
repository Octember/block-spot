-- CreateEnum
CREATE TYPE "OrganizationUserRole" AS ENUM ('OWNER', 'MEMBER');

-- AlterTable
ALTER TABLE "OrganizationUser" ADD COLUMN     "role" "OrganizationUserRole" NOT NULL DEFAULT 'MEMBER';
