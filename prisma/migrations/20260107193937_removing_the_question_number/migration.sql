/*
  Warnings:

  - You are about to drop the column `questionNumber` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "papers" ALTER COLUMN "year" DROP NOT NULL,
ALTER COLUMN "totalMarks" DROP NOT NULL,
ALTER COLUMN "totalDuration" DROP NOT NULL,
ALTER COLUMN "totalQuestions" DROP NOT NULL,
ALTER COLUMN "totalSingleChoice" DROP NOT NULL,
ALTER COLUMN "totalMultiChoice" DROP NOT NULL,
ALTER COLUMN "totalInteger" DROP NOT NULL,
ALTER COLUMN "date" DROP NOT NULL,
ALTER COLUMN "day" DROP NOT NULL,
ALTER COLUMN "month" DROP NOT NULL;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "questionNumber";
