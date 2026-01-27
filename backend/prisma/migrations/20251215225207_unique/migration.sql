/*
  Warnings:

  - A unique constraint covering the columns `[barberId,dayOfWeek]` on the table `WorkingHour` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "WorkingHour_barberId_dayOfWeek_startMin_endMin_key";

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHour_barberId_dayOfWeek_key" ON "WorkingHour"("barberId", "dayOfWeek");
