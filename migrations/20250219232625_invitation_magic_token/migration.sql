/*
  Warnings:

  - You are about to drop the `MagicLoginToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MagicLoginToken" DROP CONSTRAINT "MagicLoginToken_userId_fkey";

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "used" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT;

-- DropTable
DROP TABLE "MagicLoginToken";

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
