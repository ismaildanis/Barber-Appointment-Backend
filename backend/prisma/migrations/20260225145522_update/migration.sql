/*
  Warnings:

  - You are about to drop the column `weekKey` on the `GameSession` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopId,customerId,gameType]` on the table `GameSession` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "GameSession_shopId_customerId_gameType_weekKey_key";

-- AlterTable
ALTER TABLE "GameSession" DROP COLUMN "weekKey";

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_shopId_customerId_gameType_key" ON "GameSession"("shopId", "customerId", "gameType");
