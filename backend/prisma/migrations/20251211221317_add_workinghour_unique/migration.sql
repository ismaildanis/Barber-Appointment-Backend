/*
  Warnings:

  - A unique constraint covering the columns `[workingHourId,startMin,endMin]` on the table `BreakPeriod` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BreakPeriod_workingHourId_startMin_endMin_key" ON "BreakPeriod"("workingHourId", "startMin", "endMin");
