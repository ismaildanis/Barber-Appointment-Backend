-- CreateTable
CREATE TABLE "CampaignService" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "CampaignService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignService_campaignId_serviceId_key" ON "CampaignService"("campaignId", "serviceId");

-- AddForeignKey
ALTER TABLE "CampaignService" ADD CONSTRAINT "CampaignService_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignService" ADD CONSTRAINT "CampaignService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
