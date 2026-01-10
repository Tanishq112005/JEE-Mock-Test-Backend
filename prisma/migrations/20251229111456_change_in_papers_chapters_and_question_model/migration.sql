/*
  Warnings:

  - You are about to drop the column `session` on the `papers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `chapters` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[examId,year,shift]` on the table `papers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mode` to the `papers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExamMode" AS ENUM ('online', 'offline');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Shift" ADD VALUE 'Paper_1';
ALTER TYPE "Shift" ADD VALUE 'Paper_2';

-- DropIndex
DROP INDEX "papers_examId_year_session_shift_key";

-- AlterTable
ALTER TABLE "papers" DROP COLUMN "session",
ADD COLUMN     "mode" "ExamMode" NOT NULL,
ALTER COLUMN "totalMarks" SET DEFAULT 0,
ALTER COLUMN "totalDuration" SET DEFAULT 0,
ALTER COLUMN "totalQuestions" SET DEFAULT 0;

-- DropEnum
DROP TYPE "Session";

-- CreateIndex
CREATE UNIQUE INDEX "chapters_name_key" ON "chapters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "papers_examId_year_shift_key" ON "papers"("examId", "year", "shift");
