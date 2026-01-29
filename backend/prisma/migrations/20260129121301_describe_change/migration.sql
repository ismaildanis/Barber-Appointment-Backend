-- DropIndex
DROP INDEX "PasswordReset_phone_idx";

-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Barber" ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL;
