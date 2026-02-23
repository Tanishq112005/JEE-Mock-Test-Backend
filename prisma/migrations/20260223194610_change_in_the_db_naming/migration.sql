/*
  Warnings:

  - You are about to drop the `bookmarkedQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chapterWiseQuestionAttemptStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chapters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exam` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `options` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `paperMarkingScheme` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `papers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `solution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `studentProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `testQuestionAttemptStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `testStatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChapterAnalytics" DROP CONSTRAINT "ChapterAnalytics_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "ChapterAnalytics" DROP CONSTRAINT "ChapterAnalytics_studentId_fkey";

-- DropForeignKey
ALTER TABLE "DailyActivityLog" DROP CONSTRAINT "DailyActivityLog_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ExamAnalytics" DROP CONSTRAINT "ExamAnalytics_studentId_fkey";

-- DropForeignKey
ALTER TABLE "PaperGlobalStats" DROP CONSTRAINT "PaperGlobalStats_paperId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionGlobalStats" DROP CONSTRAINT "QuestionGlobalStats_questionId_fkey";

-- DropForeignKey
ALTER TABLE "StudentOverallAnalytics" DROP CONSTRAINT "StudentOverallAnalytics_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentQuestionAnalytics" DROP CONSTRAINT "StudentQuestionAnalytics_studentId_fkey";

-- DropForeignKey
ALTER TABLE "SubjectAnalytics" DROP CONSTRAINT "SubjectAnalytics_studentId_fkey";

-- DropForeignKey
ALTER TABLE "SubjectAnalytics" DROP CONSTRAINT "SubjectAnalytics_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "TestAttemptSummary" DROP CONSTRAINT "TestAttemptSummary_studentId_fkey";

-- DropForeignKey
ALTER TABLE "TestAttemptSummary" DROP CONSTRAINT "TestAttemptSummary_testStatusId_fkey";

-- DropForeignKey
ALTER TABLE "TestChapterAnalytics" DROP CONSTRAINT "TestChapterAnalytics_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "TestChapterAnalytics" DROP CONSTRAINT "TestChapterAnalytics_studentId_fkey";

-- DropForeignKey
ALTER TABLE "bookmarkedQuestion" DROP CONSTRAINT "bookmarkedQuestion_questionId_fkey";

-- DropForeignKey
ALTER TABLE "bookmarkedQuestion" DROP CONSTRAINT "bookmarkedQuestion_studentId_fkey";

-- DropForeignKey
ALTER TABLE "chapterWiseQuestionAttemptStatus" DROP CONSTRAINT "chapterWiseQuestionAttemptStatus_questionId_fkey";

-- DropForeignKey
ALTER TABLE "chapterWiseQuestionAttemptStatus" DROP CONSTRAINT "chapterWiseQuestionAttemptStatus_studentId_fkey";

-- DropForeignKey
ALTER TABLE "chapters" DROP CONSTRAINT "chapters_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "options" DROP CONSTRAINT "options_questionId_fkey";

-- DropForeignKey
ALTER TABLE "paperMarkingScheme" DROP CONSTRAINT "paperMarkingScheme_paperId_fkey";

-- DropForeignKey
ALTER TABLE "papers" DROP CONSTRAINT "papers_examId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_paperId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "solution" DROP CONSTRAINT "solution_questionId_fkey";

-- DropForeignKey
ALTER TABLE "studentProfile" DROP CONSTRAINT "studentProfile_user_id_fkey";

-- DropForeignKey
ALTER TABLE "testQuestionAttemptStatus" DROP CONSTRAINT "testQuestionAttemptStatus_questionId_fkey";

-- DropForeignKey
ALTER TABLE "testQuestionAttemptStatus" DROP CONSTRAINT "testQuestionAttemptStatus_studentId_fkey";

-- DropForeignKey
ALTER TABLE "testQuestionAttemptStatus" DROP CONSTRAINT "testQuestionAttemptStatus_testStatusId_fkey";

-- DropForeignKey
ALTER TABLE "testStatus" DROP CONSTRAINT "testStatus_activeQuestionId_fkey";

-- DropForeignKey
ALTER TABLE "testStatus" DROP CONSTRAINT "testStatus_paperId_fkey";

-- DropForeignKey
ALTER TABLE "testStatus" DROP CONSTRAINT "testStatus_studentId_fkey";

-- DropTable
DROP TABLE "bookmarkedQuestion";

-- DropTable
DROP TABLE "chapterWiseQuestionAttemptStatus";

-- DropTable
DROP TABLE "chapters";

-- DropTable
DROP TABLE "exam";

-- DropTable
DROP TABLE "options";

-- DropTable
DROP TABLE "paperMarkingScheme";

-- DropTable
DROP TABLE "papers";

-- DropTable
DROP TABLE "questions";

-- DropTable
DROP TABLE "solution";

-- DropTable
DROP TABLE "studentProfile";

-- DropTable
DROP TABLE "subjects";

-- DropTable
DROP TABLE "testQuestionAttemptStatus";

-- DropTable
DROP TABLE "testStatus";

-- DropTable
DROP TABLE "user";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" "UserType" NOT NULL DEFAULT 'Student',
    "password" TEXT NOT NULL,
    "refersh_token" TEXT,
    "lastVisited" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_verified" BOOLEAN NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "class" INTEGER,
    "institution" TEXT,
    "phone" BIGINT,
    "phone_country_code" TEXT,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "maximumStreak" INTEGER NOT NULL DEFAULT 0,
    "globalRank" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "name" "ExamName" NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subjects" (
    "id" TEXT NOT NULL,
    "name" "SubjectName" NOT NULL,
    "totalQuestion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "class" INTEGER NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "isJeeMain" BOOLEAN NOT NULL DEFAULT false,
    "isJeeAdvanced" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Papers" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "year" INTEGER,
    "mode" "ExamMode" NOT NULL,
    "month" "Month" NOT NULL,
    "day" "Day" NOT NULL,
    "date" TEXT NOT NULL,
    "shift" "Shift" NOT NULL,
    "totalMarks" INTEGER DEFAULT 0,
    "totalDuration" INTEGER DEFAULT 0,
    "totalQuestions" INTEGER DEFAULT 0,

    CONSTRAINT "Papers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperMarkingScheme" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "questionType" "questionType" NOT NULL,
    "positiveMarks" INTEGER NOT NULL,
    "negativeMarks" INTEGER NOT NULL,
    "isPartial" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PaperMarkingScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questions" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "paperId" TEXT,
    "class" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "image" TEXT[],
    "type" "questionType" NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "comprehensionContent" TEXT,
    "comprehensionImage" TEXT[],
    "positiveMarks" INTEGER NOT NULL,
    "negativeMarks" INTEGER NOT NULL,
    "isOutOfSyllabus" BOOLEAN NOT NULL DEFAULT false,
    "isBonus" BOOLEAN NOT NULL DEFAULT false,
    "correctAnswer" TEXT[],

    CONSTRAINT "Questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionAtext" TEXT,
    "optionAimage" TEXT[],
    "optionBtext" TEXT,
    "optionBimage" TEXT[],
    "optionCtext" TEXT,
    "optionCimage" TEXT[],
    "optionDtext" TEXT,
    "optionDimage" TEXT[],

    CONSTRAINT "Options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solution" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "videoUrl" TEXT,
    "image" TEXT[],

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestStatus" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "status" "TestState" NOT NULL DEFAULT 'IN_PROGRESS',
    "timeLeft" INTEGER NOT NULL,
    "activeQuestionId" TEXT,
    "isAnalyzed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeSection" TEXT,

    CONSTRAINT "TestStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestQuestionAttemptStatus" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "testStatusId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "status" "AttemptStatus" NOT NULL DEFAULT 'notAnswered',
    "marksObtained" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timeSpent" INTEGER NOT NULL,
    "userAnswer" TEXT[],
    "isVisited" BOOLEAN NOT NULL DEFAULT false,
    "markedForReview" BOOLEAN NOT NULL DEFAULT false,
    "isAnalyzed" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestQuestionAttemptStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterWiseQuestionAttemptStatus" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "questionStatus" "AttemptStatus" NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "marksObtained" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timeSpent" INTEGER NOT NULL,
    "userAnswer" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAnalyzed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChapterWiseQuestionAttemptStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookmarkedQuestion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookmarkedQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_password_key" ON "User"("password");

-- CreateIndex
CREATE UNIQUE INDEX "User_refersh_token_key" ON "User"("refersh_token");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_user_id_key" ON "StudentProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_phone_key" ON "StudentProfile"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_name_key" ON "Exam"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subjects_name_key" ON "Subjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Chapters_name_key" ON "Chapters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PaperMarkingScheme_paperId_questionType_key" ON "PaperMarkingScheme"("paperId", "questionType");

-- CreateIndex
CREATE UNIQUE INDEX "Options_questionId_key" ON "Options"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Solution_questionId_key" ON "Solution"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "TestStatus_paperId_created_at_key" ON "TestStatus"("paperId", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "TestQuestionAttemptStatus_questionId_testStatusId_key" ON "TestQuestionAttemptStatus"("questionId", "testStatusId");

-- CreateIndex
CREATE INDEX "ChapterWiseQuestionAttemptStatus_studentId_questionId_creat_idx" ON "ChapterWiseQuestionAttemptStatus"("studentId", "questionId", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "BookmarkedQuestion_studentId_questionId_key" ON "BookmarkedQuestion"("studentId", "questionId");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapters" ADD CONSTRAINT "Chapters_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Papers" ADD CONSTRAINT "Papers_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperMarkingScheme" ADD CONSTRAINT "PaperMarkingScheme_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Options" ADD CONSTRAINT "Options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solution" ADD CONSTRAINT "Solution_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestStatus" ADD CONSTRAINT "TestStatus_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestStatus" ADD CONSTRAINT "TestStatus_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestStatus" ADD CONSTRAINT "TestStatus_activeQuestionId_fkey" FOREIGN KEY ("activeQuestionId") REFERENCES "Questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestionAttemptStatus" ADD CONSTRAINT "TestQuestionAttemptStatus_testStatusId_fkey" FOREIGN KEY ("testStatusId") REFERENCES "TestStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestionAttemptStatus" ADD CONSTRAINT "TestQuestionAttemptStatus_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestionAttemptStatus" ADD CONSTRAINT "TestQuestionAttemptStatus_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterWiseQuestionAttemptStatus" ADD CONSTRAINT "ChapterWiseQuestionAttemptStatus_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterWiseQuestionAttemptStatus" ADD CONSTRAINT "ChapterWiseQuestionAttemptStatus_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentOverallAnalytics" ADD CONSTRAINT "StudentOverallAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAnalytics" ADD CONSTRAINT "SubjectAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAnalytics" ADD CONSTRAINT "SubjectAnalytics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterAnalytics" ADD CONSTRAINT "ChapterAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterAnalytics" ADD CONSTRAINT "ChapterAnalytics_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestChapterAnalytics" ADD CONSTRAINT "TestChapterAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestChapterAnalytics" ADD CONSTRAINT "TestChapterAnalytics_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnalytics" ADD CONSTRAINT "ExamAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentQuestionAnalytics" ADD CONSTRAINT "StudentQuestionAnalytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttemptSummary" ADD CONSTRAINT "TestAttemptSummary_testStatusId_fkey" FOREIGN KEY ("testStatusId") REFERENCES "TestStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttemptSummary" ADD CONSTRAINT "TestAttemptSummary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaperGlobalStats" ADD CONSTRAINT "PaperGlobalStats_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGlobalStats" ADD CONSTRAINT "QuestionGlobalStats_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyActivityLog" ADD CONSTRAINT "DailyActivityLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkedQuestion" ADD CONSTRAINT "BookmarkedQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkedQuestion" ADD CONSTRAINT "BookmarkedQuestion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
