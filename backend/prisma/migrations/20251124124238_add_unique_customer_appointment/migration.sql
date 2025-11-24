/*
  Warnings:

  - A unique constraint covering the columns `[customerId]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Appointment_customerId_key" ON "Appointment"("customerId");
