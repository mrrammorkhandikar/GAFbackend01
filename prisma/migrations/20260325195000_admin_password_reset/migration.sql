-- CreateTable
CREATE TABLE "AdminPasswordReset" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminPasswordReset_adminId_idx" ON "AdminPasswordReset"("adminId");

-- CreateIndex
CREATE INDEX "AdminPasswordReset_expiresAt_idx" ON "AdminPasswordReset"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminPasswordReset_consumedAt_idx" ON "AdminPasswordReset"("consumedAt");

-- AddForeignKey
ALTER TABLE "AdminPasswordReset" ADD CONSTRAINT "AdminPasswordReset_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

