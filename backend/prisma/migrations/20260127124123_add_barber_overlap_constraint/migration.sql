CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
ADD CONSTRAINT no_barber_overlap
EXCLUDE USING gist (
  "barberId" WITH =,
  tsrange("appointmentStartAt", "appointmentEndAt") WITH &&
)
WHERE ("status" = 'SCHEDULED');
