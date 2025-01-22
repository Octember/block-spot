/*
  Warnings:

  - Added the required column `organizationId` to the `Venue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT '5ad79a36-921f-42fa-b284-9812b9eab86b';

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT 
"Venue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;