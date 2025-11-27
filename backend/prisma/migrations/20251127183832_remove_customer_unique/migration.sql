-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'EXPIRED';

-- DropIndex
DROP INDEX "Appointment_customerId_key";
