-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('AVAILABLE', 'USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('SPIN_WHEEL');

-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "wheelEnabled" BOOLEAN NOT NULL DEFAULT true,
    "wheelWeight" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "appointmentId" INTEGER,
    "status" "RewardStatus" NOT NULL DEFAULT 'AVAILABLE',
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "gameType" "GameType" NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "weekKey" TEXT NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_shopId_active_wheelEnabled_startAt_endAt_idx" ON "Campaign"("shopId", "active", "wheelEnabled", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "Reward_shopId_customerId_status_idx" ON "Reward"("shopId", "customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_appointmentId_key" ON "Reward"("appointmentId");

-- CreateIndex
CREATE INDEX "GameSession_shopId_customerId_playedAt_idx" ON "GameSession"("shopId", "customerId", "playedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_shopId_customerId_gameType_weekKey_key" ON "GameSession"("shopId", "customerId", "gameType", "weekKey");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
