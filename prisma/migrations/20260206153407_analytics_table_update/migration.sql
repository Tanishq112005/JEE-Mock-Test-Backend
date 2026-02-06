/*
  Warnings:

  - You are about to drop the column `averageTime` on the `QuestionGlobalStats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QuestionGlobalStats" DROP COLUMN "averageTime",
ADD COLUMN     "totalTimeSpent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "QuestionTypeAnalytics" ADD COLUMN     "totalTimeSpent" INTEGER NOT NULL DEFAULT 0;
