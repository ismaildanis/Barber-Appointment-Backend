-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'BARBER_CANCELLED';

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3);
