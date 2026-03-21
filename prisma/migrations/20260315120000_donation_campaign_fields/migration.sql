-- AlterTable
ALTER TABLE "Donation" ADD COLUMN "donorPhone" TEXT,
ADD COLUMN "donorAddress" TEXT,
ADD COLUMN "receiptUrl" TEXT,
ADD COLUMN "campaignId" TEXT;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
