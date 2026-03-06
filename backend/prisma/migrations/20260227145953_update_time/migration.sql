/*
  Warnings:

  - Added the required column `campaignId` to the `GameSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GameSession" ADD COLUMN     "campaignId" INTEGER NOT NULL;
