/*
  Warnings:

  - You are about to drop the column `maxPossibleMarks` on the `ChapterAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `practiceAttempted` on the `ChapterAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `practiceCorrect` on the `ChapterAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `testAttempted` on the `ChapterAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `testCorrect` on the `ChapterAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalMarksEarned` on the `ChapterAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalTimeSpent` on the `ChapterAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalAttempted` on the `ExamAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalMarksEarned` on the `ExamAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `difficultyRating` on the `QuestionGlobalStats` table. All the data in the column will be lost.
  - You are about to drop the column `totalCorrect` on the `QuestionGlobalStats` table. All the data in the column will be lost.
  - You are about to drop the column `totalPartial` on the `QuestionGlobalStats` table. All the data in the column will be lost.
  - You are about to drop the column `maxPossibleMarks` on the `StudentOverallAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalAttempted` on the `StudentOverallAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalCorrect` on the `StudentOverallAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalMarksEarned` on the `StudentOverallAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalPartial` on the `StudentOverallAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalTimeSpent` on the `StudentOverallAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `maxPossibleMarks` on the `SubjectAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalAttempted` on the `SubjectAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalCorrect` on the `SubjectAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalMarksEarned` on the `SubjectAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalTimeSpent` on the `SubjectAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `efficiency` on the `TestAttemptSummary` table. All the data in the column will be lost.
  - You are about to drop the column `subjectSplits` on the `TestAttemptSummary` table. All the data in the column will be lost.
  - You are about to drop the column `partialMarks` on the `paperMarkingScheme` table. All the data in the column will be lost.
  - You are about to drop the column `ruleType` on the `paperMarkingScheme` table. All the data in the column will be lost.
  - You are about to drop the column `totalInteger` on the `papers` table. All the data in the column will be lost.
  - You are about to drop the column `totalMultiChoice` on the `papers` table. All the data in the column will be lost.
  - You are about to drop the column `totalSingleChoice` on the `papers` table. All the data in the column will be lost.
  - You are about to drop the column `rank` on the `studentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `study_mode` on the `studentProfile` table. All the data in the column will be lost.
  - You are about to alter the column `maximumStreak` on the `studentProfile` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `streak` on the `studentProfile` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to drop the `QuestionTypeAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `date` on table `papers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `shift` on table `papers` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `studentId` to the `testQuestionAttemptStatus` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QuestionTypeAnalytics" DROP CONSTRAINT "QuestionTypeAnalytics_studentId_fkey";

-- DropIndex
DROP INDEX "papers_examId_year_shift_key";

-- AlterTable
ALTER TABLE "ChapterAnalytics" DROP COLUMN "maxPossibleMarks",
DROP COLUMN "practiceAttempted",
DROP COLUMN "practiceCorrect",
DROP COLUMN "testAttempted",
DROP COLUMN "testCorrect",
DROP COLUMN "totalMarksEarned",
DROP COLUMN "totalTimeSpent",
ADD COLUMN     "practiceJeeAdvancedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceJeeAdvancedCorrect" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceJeeAdvancedMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "practiceJeeAdvancedMaxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "practiceJeeAdvancedPartial" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceJeeAdvancedTimeSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceJeeAdvancedWrong" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceJeeMainAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceJeeMainCorrect" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceJeeMainMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "practiceJeeMainMaxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "practiceJeeMainPartial" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceJeeMainTimeSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceJeeMainWrong" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testJeeAdvancedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testJeeAdvancedCorrect" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testJeeAdvancedMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "testJeeAdvancedMaxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "testJeeAdvancedPartial" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testJeeAdvancedTimeSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testJeeAdvancedWrong" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testJeeMainAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testJeeMainCorrect" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testJeeMainMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "testJeeMainMaxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "testJeeMainPartial" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testJeeMainTimeSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testJeeMainWrong" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ExamAnalytics" DROP COLUMN "totalAttempted",
DROP COLUMN "totalMarksEarned",
ADD COLUMN     "practiceAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "practiceMaxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "practiceTimeSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "testMaxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "testTimeSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "QuestionGlobalStats" DROP COLUMN "difficultyRating",
DROP COLUMN "totalCorrect",
DROP COLUMN "totalPartial",
ADD COLUMN     "leastTimeInPratice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "leastTimeInTest" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "maxPossibleMarks" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "maxPossibleMarksEarnedInPratice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "totalAttemptsInPratice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "totalMarksEarnedInPratice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "totalTimeSpentInPratice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "StudentOverallAnalytics" DROP COLUMN "maxPossibleMarks",
DROP COLUMN "totalAttempted",
DROP COLUMN "totalCorrect",
DROP COLUMN "totalMarksEarned",
DROP COLUMN "totalPartial",
DROP COLUMN "totalTimeSpent",
ADD COLUMN     "practiceAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "practiceMaxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "practiceTimeSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "testMaxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "testTimeSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "uniquePracticeAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "uniqueTestAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SubjectAnalytics" DROP COLUMN "maxPossibleMarks",
DROP COLUMN "totalAttempted",
DROP COLUMN "totalCorrect",
DROP COLUMN "totalMarksEarned",
DROP COLUMN "totalTimeSpent",
ADD COLUMN     "practiceAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "practiceMaxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "practiceTimeSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "testMaxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "testTimeSpent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TestAttemptSummary" DROP COLUMN "efficiency",
DROP COLUMN "subjectSplits",
ADD COLUMN     "avgTimePerQ" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "chapterSplits" JSONB;

-- AlterTable
ALTER TABLE "chapterWiseQuestionAttemptStatus" ADD COLUMN     "isAnalyzed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "paperMarkingScheme" DROP COLUMN "partialMarks",
DROP COLUMN "ruleType";

-- AlterTable
ALTER TABLE "papers" DROP COLUMN "totalInteger",
DROP COLUMN "totalMultiChoice",
DROP COLUMN "totalSingleChoice",
ALTER COLUMN "date" SET NOT NULL,
ALTER COLUMN "shift" SET NOT NULL;

-- AlterTable
ALTER TABLE "questions" ALTER COLUMN "comprehensionContent" DROP NOT NULL;

-- AlterTable
ALTER TABLE "studentProfile" DROP COLUMN "rank",
DROP COLUMN "study_mode",
ADD COLUMN     "globalRank" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "maximumStreak" SET DATA TYPE INTEGER,
ALTER COLUMN "streak" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "totalQuestion" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "testQuestionAttemptStatus" ADD COLUMN     "isAnalyzed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "testStatus" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "QuestionTypeAnalytics";

-- DropEnum
DROP TYPE "PartialMarkingRule";

-- DropEnum
DROP TYPE "Study_mode";

-- CreateTable
CREATE TABLE "TestChapterAnalytics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "testStatusId" TEXT NOT NULL,
    "examName" "ExamName" NOT NULL,
    "chapterName" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "partial" INTEGER NOT NULL DEFAULT 0,
    "wrong" INTEGER NOT NULL DEFAULT 0,
    "marksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "positiveMarks" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "partialMarks" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timeTaken" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestChapterAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentQuestionAnalytics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "questioType" "questionType" NOT NULL,
    "practiceAttempts" INTEGER NOT NULL DEFAULT 0,
    "practiceTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "practiceMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "practiceMaxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "testAttempts" INTEGER NOT NULL DEFAULT 0,
    "testTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "testMarksEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "testMaxPossible" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentQuestionAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectTestResult" (
    "id" TEXT NOT NULL,
    "summaryId" TEXT NOT NULL,
    "subjectName" "SubjectName" NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "attempted" INTEGER NOT NULL,
    "correct" INTEGER NOT NULL,
    "partial" INTEGER NOT NULL,
    "wrong" INTEGER NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,
    "positiveMarks" DOUBLE PRECISION NOT NULL,
    "partialMarks" DOUBLE PRECISION NOT NULL,
    "negativeMarks" DOUBLE PRECISION NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SubjectTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTypeTestResult" (
    "id" TEXT NOT NULL,
    "summaryId" TEXT NOT NULL,
    "questionType" "questionType" NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "attempted" INTEGER NOT NULL,
    "correct" INTEGER NOT NULL,
    "partial" INTEGER NOT NULL,
    "wrong" INTEGER NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,
    "positiveMarks" DOUBLE PRECISION NOT NULL,
    "partialMarks" DOUBLE PRECISION NOT NULL,
    "negativeMarks" DOUBLE PRECISION NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "QuestionTypeTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperGlobalStats" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "highestScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageTimeTaken" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperGlobalStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyActivityLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "questionsSolved" INTEGER NOT NULL DEFAULT 0,
    "questionsCorrect" INTEGER NOT NULL DEFAULT 0,
    "testsTaken" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestChapterAnalytics_studentId_chapterId_testStatusId_key" ON "TestChapterAnalytics"("studentId", "chapterId", "testStatusId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentQuestionAnalytics_studentId_questioType_key" ON "StudentQuestionAnalytics"("studentId", "questioType");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectTestResult_summaryId_subjectName_key" ON "SubjectTestResult"("summaryId", "subjectName");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTypeTestResult_summaryId_questionType_key" ON "QuestionTypeTestResult"("summaryId", "questionType");

-- CreateIndex
CREATE UNIQUE INDEX "PaperGlobalStats_paperId_key" ON "PaperGlobalStats"("paperId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyActivityLog_studentId_date_key" ON "DailyActivityLog"("studentId", "date");

-- AddForeignKey
ALTER TABLE "testQuestionAttemptStatus" ADD CONSTRAINT "testQuestionAttemptStatus_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestChapterAnalytics" ADD CONSTRAINT "TestChapterAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestChapterAnalytics" ADD CONSTRAINT "TestChapterAnalytics_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestChapterAnalytics" ADD CONSTRAINT "TestChapterAnalytics_studentId_chapterId_fkey" FOREIGN KEY ("studentId", "chapterId") REFERENCES "ChapterAnalytics"("studentId", "chapterId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentQuestionAnalytics" ADD CONSTRAINT "StudentQuestionAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectTestResult" ADD CONSTRAINT "SubjectTestResult_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "TestAttemptSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTypeTestResult" ADD CONSTRAINT "QuestionTypeTestResult_summaryId_fkey" FOREIGN KEY ("summaryId") REFERENCES "TestAttemptSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperGlobalStats" ADD CONSTRAINT "PaperGlobalStats_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyActivityLog" ADD CONSTRAINT "DailyActivityLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
