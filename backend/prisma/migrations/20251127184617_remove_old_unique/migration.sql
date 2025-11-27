-- 1) Eski unique index'i kaldır
DROP INDEX IF EXISTS "Appointment_barberId_appointmentAt_key";

-- 2) Yeni partial unique index oluştur
CREATE UNIQUE INDEX appointment_unique_scheduled
ON "Appointment"("barberId", "appointmentAt")
WHERE status = 'SCHEDULED';
