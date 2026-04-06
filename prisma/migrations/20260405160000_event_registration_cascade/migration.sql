-- Allow deleting an Event when registrations exist (DB-level cascade; API also deletes explicitly in a transaction).
ALTER TABLE "EventRegistration" DROP CONSTRAINT "EventRegistration_eventId_fkey";

ALTER TABLE "EventRegistration"
  ADD CONSTRAINT "EventRegistration_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
