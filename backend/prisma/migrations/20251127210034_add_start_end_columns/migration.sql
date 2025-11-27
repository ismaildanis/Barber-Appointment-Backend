/*
  Warnings:

  - You are about to drop the column `appointmentAt` on the `Appointment` table. All the data in the column will be lost.
  - Added the required column `appointmentEndAt` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `appointmentStartAt` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "appointmentAt",
ADD COLUMN     "appointmentEndAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "appointmentStartAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Appointment_barberId_appointmentStartAt_idx" ON "Appointment"("barberId", "appointmentStartAt");

-- CreateIndex
CREATE INDEX "Appointment_appointmentStartAt_appointmentEndAt_idx" ON "Appointment"("appointmentStartAt", "appointmentEndAt");
