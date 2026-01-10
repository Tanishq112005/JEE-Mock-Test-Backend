-- AlterTable
ALTER TABLE "chapters" ADD COLUMN     "isCbse" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isJeeAdvanced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isJeeMain" BOOLEAN NOT NULL DEFAULT false;
