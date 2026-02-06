/*
  Warnings:

  - You are about to drop the column `totoalSingleChoice` on the `papers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "papers" DROP COLUMN "totoalSingleChoice",
ADD COLUMN     "totalSingleChoice" INTEGER NOT NULL DEFAULT 0;
