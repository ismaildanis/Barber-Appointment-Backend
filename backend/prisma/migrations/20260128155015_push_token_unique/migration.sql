/*
  Warnings:

  - A unique constraint covering the columns `[userId,role]` on the table `PushToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PushToken_userId_role_key" ON "PushToken"("userId", "role");
