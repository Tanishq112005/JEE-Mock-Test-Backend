/*
  Warnings:

  - You are about to drop the column `submit_at` on the `chapterWiseQuestionAttemptStatus` table. All the data in the column will be lost.
  - You are about to drop the column `partialPerQuestionMarks` on the `paperMarkingScheme` table. All the data in the column will be lost.
  - You are about to drop the column `postiveMarks` on the `paperMarkingScheme` table. All the data in the column will be lost.
  - You are about to drop the column `day` on the `papers` table. All the data in the column will be lost.
  - You are about to drop the column `month` on the `papers` table. All the data in the column will be lost.
  - You are about to drop the column `totalInteger` on the `papers` table. All the data in the column will be lost.
  - You are about to drop the column `totalMultiChoice` on the `papers` table. All the data in the column will be lost.
  - You are about to drop the column `totalSingleChoice` on the `papers` table. All the data in the column will be lost.
  - You are about to drop the column `class` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `comprehensionContent` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `comprehensionImage` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `questionNumber` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `activeSection` on the `testStatus` table. All the data in the column will be lost.
  - Added the required column `positiveMarks` to the `paperMarkingScheme` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PartialMarkingRule" AS ENUM ('NONE', 'LINEAR', 'STEP_WISE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttemptStatus" ADD VALUE 'markedForReview';
ALTER TYPE "AttemptStatus" ADD VALUE 'visited';

-- DropForeignKey
ALTER TABLE "testStatus" DROP CONSTRAINT "testStatus_activeQuestionId_fkey";

-- AlterTable
ALTER TABLE "chapterWiseQuestionAttemptStatus" DROP COLUMN "submit_at",
ALTER COLUMN "marksObtained" SET DEFAULT 0.0,
ALTER COLUMN "marksObtained" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "paperMarkingScheme" DROP COLUMN "partialPerQuestionMarks",
DROP COLUMN "postiveMarks",
ADD COLUMN     "partialMarks" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "positiveMarks" INTEGER NOT NULL,
ADD COLUMN     "ruleType" "PartialMarkingRule" NOT NULL DEFAULT 'NONE',
ALTER COLUMN "isPartial" SET DEFAULT false;

-- AlterTable
ALTER TABLE "papers" DROP COLUMN "day",
DROP COLUMN "month",
DROP COLUMN "totalInteger",
DROP COLUMN "totalMultiChoice",
DROP COLUMN "totalSingleChoice";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "class",
DROP COLUMN "comprehensionContent",
DROP COLUMN "comprehensionImage",
DROP COLUMN "questionNumber",
ALTER COLUMN "isBonus" SET DEFAULT false,
ALTER COLUMN "isOutOfSyllabus" SET DEFAULT false;

-- AlterTable
ALTER TABLE "testQuestionAttemptStatus" ALTER COLUMN "marksObtained" SET DEFAULT 0.0,
ALTER COLUMN "marksObtained" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "testStatus" DROP COLUMN "activeSection",
ADD COLUMN     "isAnalyzed" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "Day";

-- DropEnum
DROP TYPE "Month";

-- DropEnum
DROP TYPE "paperStatus";

-- DropEnum
DROP TYPE "questionSource";

-- CreateTable
CREATE TABLE "StudentOverallAnalytics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "totalAttempted" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalPartial" INTEGER NOT NULL DEFAULT 0,
    "totalMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maxPossibleMarks" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StudentOverallAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectAnalytics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "totalAttempted" INTEGER NOT NULL DEFAULT 0,
    "totalMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maxPossibleMarks" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SubjectAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterAnalytics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "totalMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maxPossibleMarks" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "practiceAttempted" INTEGER NOT NULL DEFAULT 0,
    "practiceCorrect" INTEGER NOT NULL DEFAULT 0,
    "testAttempted" INTEGER NOT NULL DEFAULT 0,
    "testCorrect" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChapterAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTypeAnalytics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "questionType" NOT NULL,
    "totalAttempted" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalPartial" INTEGER NOT NULL DEFAULT 0,
    "totalMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "QuestionTypeAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAnalytics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examName" "ExamName" NOT NULL,
    "totalAttempted" INTEGER NOT NULL DEFAULT 0,
    "totalMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "testsCompleted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExamAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAttemptSummary" (
    "id" TEXT NOT NULL,
    "testStatusId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "efficiency" DOUBLE PRECISION NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "subjectSplits" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestAttemptSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionGlobalStats" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalPartial" INTEGER NOT NULL DEFAULT 0,
    "averageTime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "difficultyRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "QuestionGlobalStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentOverallAnalytics_studentId_key" ON "StudentOverallAnalytics"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectAnalytics_studentId_subjectId_key" ON "SubjectAnalytics"("studentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterAnalytics_studentId_chapterId_key" ON "ChapterAnalytics"("studentId", "chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTypeAnalytics_studentId_type_key" ON "QuestionTypeAnalytics"("studentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAnalytics_studentId_examName_key" ON "ExamAnalytics"("studentId", "examName");

-- CreateIndex
CREATE UNIQUE INDEX "TestAttemptSummary_testStatusId_key" ON "TestAttemptSummary"("testStatusId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionGlobalStats_questionId_key" ON "QuestionGlobalStats"("questionId");

-- AddForeignKey
ALTER TABLE "testStatus" ADD CONSTRAINT "testStatus_activeQuestionId_fkey" FOREIGN KEY ("activeQuestionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentOverallAnalytics" ADD CONSTRAINT "StudentOverallAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAnalytics" ADD CONSTRAINT "SubjectAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAnalytics" ADD CONSTRAINT "SubjectAnalytics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterAnalytics" ADD CONSTRAINT "ChapterAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterAnalytics" ADD CONSTRAINT "ChapterAnalytics_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTypeAnalytics" ADD CONSTRAINT "QuestionTypeAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnalytics" ADD CONSTRAINT "ExamAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttemptSummary" ADD CONSTRAINT "TestAttemptSummary_testStatusId_fkey" FOREIGN KEY ("testStatusId") REFERENCES "testStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttemptSummary" ADD CONSTRAINT "TestAttemptSummary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGlobalStats" ADD CONSTRAINT "QuestionGlobalStats_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
