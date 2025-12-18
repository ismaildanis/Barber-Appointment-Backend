/*
  Warnings:

  - Made the column `createdAt` on table `BreakPeriod` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "BreakPeriod" ALTER COLUMN "createdAt" SET NOT NULL;
