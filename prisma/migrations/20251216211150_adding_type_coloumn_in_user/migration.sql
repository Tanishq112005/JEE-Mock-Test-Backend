-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('Student', 'Developer');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "type" "UserType" NOT NULL DEFAULT 'Student';
