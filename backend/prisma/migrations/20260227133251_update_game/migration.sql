-- DropIndex
DROP INDEX "GameSession_shopId_customerId_gameType_key";

-- DropIndex
DROP INDEX "GameSession_shopId_customerId_playedAt_idx";

-- CreateIndex
CREATE INDEX "GameSession_shopId_customerId_gameType_playedAt_idx" ON "GameSession"("shopId", "customerId", "gameType", "playedAt");
