-- AlterTable
ALTER TABLE "PasswordReset" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PasswordReset_phone_idx" ON "PasswordReset"("phone");

-- CreateIndex
CREATE INDEX "PasswordReset_expiresAt_idx" ON "PasswordReset"("expiresAt");
