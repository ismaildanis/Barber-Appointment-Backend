/*
  Warnings:

  - Made the column `duration` on table `AppointmentService` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `AppointmentService` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `AppointmentService` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AppointmentService" ALTER COLUMN "duration" SET NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "price" SET NOT NULL;
