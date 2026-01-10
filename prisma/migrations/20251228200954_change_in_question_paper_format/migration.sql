/*
  Warnings:

  - The `shift` column on the `papers` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('Morning', 'Evening');

-- AlterTable
ALTER TABLE "papers" DROP COLUMN "shift",
ADD COLUMN     "shift" "Shift";

-- AlterTable
ALTER TABLE "questions" ALTER COLUMN "paperId" DROP NOT NULL,
ALTER COLUMN "chapterId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "papers_examId_year_session_shift_key" ON "papers"("examId", "year", "session", "shift");
