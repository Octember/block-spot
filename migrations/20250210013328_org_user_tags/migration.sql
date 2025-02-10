-- CreateTable
CREATE TABLE "OrganizationTag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationUserTag" (
    "id" TEXT NOT NULL,
    "organizationUserId" TEXT NOT NULL,
    "organizationTagId" TEXT NOT NULL,

    CONSTRAINT "OrganizationUserTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationUserTag_organizationUserId_organizationTagId_key" ON "OrganizationUserTag"("organizationUserId", "organizationTagId");

-- AddForeignKey
ALTER TABLE "OrganizationTag" ADD CONSTRAINT "OrganizationTag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationUserTag" ADD CONSTRAINT "OrganizationUserTag_organizationUserId_fkey" FOREIGN KEY ("organizationUserId") REFERENCES "OrganizationUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationUserTag" ADD CONSTRAINT "OrganizationUserTag_organizationTagId_fkey" FOREIGN KEY ("organizationTagId") REFERENCES "OrganizationTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
