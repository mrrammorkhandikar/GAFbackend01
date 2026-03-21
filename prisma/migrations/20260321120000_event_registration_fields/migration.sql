-- AlterTable
ALTER TABLE "Event" ADD COLUMN "registrationEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "registrationFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN "address" TEXT;
ALTER TABLE "EventRegistration" ADD COLUMN "amount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "EventRegistration" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE "EventRegistration" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'completed';
ALTER TABLE "EventRegistration" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- New rows without explicit status default to pending
ALTER TABLE "EventRegistration" ALTER COLUMN "status" SET DEFAULT 'pending';

CREATE INDEX "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");
CREATE INDEX "EventRegistration_status_idx" ON "EventRegistration"("status");
