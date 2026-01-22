/*
  Warnings:

  - You are about to drop the column `isCbse` on the `chapters` table. All the data in the column will be lost.
  - You are about to drop the `QuestionAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_profile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `testResults` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TestState" AS ENUM ('IN_PROGRESS', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "paperStatus" AS ENUM ('Complete', 'InProgrees');

-- CreateEnum
CREATE TYPE "questionSource" AS ENUM ('ChapterWise', 'Exam');

-- DropForeignKey
ALTER TABLE "QuestionAttempt" DROP CONSTRAINT "QuestionAttempt_questionId_fkey";

-- DropForeignKey
ALTER TABLE "student_profile" DROP CONSTRAINT "student_profile_user_id_fkey";

-- DropForeignKey
ALTER TABLE "testResults" DROP CONSTRAINT "testResults_paperId_fkey";

-- DropForeignKey
ALTER TABLE "testResults" DROP CONSTRAINT "testResults_userId_fkey";

-- AlterTable
ALTER TABLE "chapters" DROP COLUMN "isCbse";

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "questionNumber" SERIAL NOT NULL;

-- DropTable
DROP TABLE "QuestionAttempt";

-- DropTable
DROP TABLE "student_profile";

-- DropTable
DROP TABLE "testResults";

-- CreateTable
CREATE TABLE "studentProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "class" INTEGER NOT NULL,
    "study_mode" "Study_mode",
    "institution" TEXT,
    "phone" BIGINT,
    "phone_country_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "status" "TestState" NOT NULL DEFAULT 'IN_PROGRESS',
    "timeLeft" INTEGER NOT NULL,
    "paperOver" BOOLEAN NOT NULL DEFAULT false,
    "activeSection" TEXT,
    "activeQuestionId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testQuestionAttemptStatus" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "testStatusId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "status" "AttemptStatus" NOT NULL DEFAULT 'ATTEMPTING',
    "marksObtained" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL,
    "isVisited" BOOLEAN NOT NULL DEFAULT false,
    "markedForReview" BOOLEAN NOT NULL DEFAULT false,
    "userAnswer" TEXT[],

    CONSTRAINT "testQuestionAttemptStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapterWiseQuestionAttemptStatus" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "questionStatus" "AttemptStatus" NOT NULL,
    "userAnswer" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapterWiseQuestionAttemptStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarkedQuestion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarkedQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "studentProfile_user_id_key" ON "studentProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "studentProfile_phone_key" ON "studentProfile"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "testStatus_userId_paperId_key" ON "testStatus"("userId", "paperId");

-- CreateIndex
CREATE UNIQUE INDEX "testQuestionAttemptStatus_questionId_testStatusId_key" ON "testQuestionAttemptStatus"("questionId", "testStatusId");

-- CreateIndex
CREATE INDEX "chapterWiseQuestionAttemptStatus_userId_questionId_idx" ON "chapterWiseQuestionAttemptStatus"("userId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarkedQuestion_userId_questionId_key" ON "bookmarkedQuestion"("userId", "questionId");

-- AddForeignKey
ALTER TABLE "studentProfile" ADD CONSTRAINT "studentProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testStatus" ADD CONSTRAINT "testStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testStatus" ADD CONSTRAINT "testStatus_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testQuestionAttemptStatus" ADD CONSTRAINT "testQuestionAttemptStatus_testStatusId_fkey" FOREIGN KEY ("testStatusId") REFERENCES "testStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testQuestionAttemptStatus" ADD CONSTRAINT "testQuestionAttemptStatus_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapterWiseQuestionAttemptStatus" ADD CONSTRAINT "chapterWiseQuestionAttemptStatus_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapterWiseQuestionAttemptStatus" ADD CONSTRAINT "chapterWiseQuestionAttemptStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarkedQuestion" ADD CONSTRAINT "bookmarkedQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarkedQuestion" ADD CONSTRAINT "bookmarkedQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
