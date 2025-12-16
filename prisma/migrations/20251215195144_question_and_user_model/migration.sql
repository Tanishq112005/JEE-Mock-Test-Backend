-- CreateEnum
CREATE TYPE "ExamName" AS ENUM ('JEE_MAIN', 'JEE_ADVANCED');

-- CreateEnum
CREATE TYPE "SubjectName" AS ENUM ('Physics', 'Chemistry', 'Mathematics');

-- CreateEnum
CREATE TYPE "Study_mode" AS ENUM ('online', 'offline', 'self');

-- CreateEnum
CREATE TYPE "questionType" AS ENUM ('SingleCorrect', 'MultiCorrect', 'MatchTheFollowing', 'Integer', 'Comprehension');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "refersh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_verified" BOOLEAN NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "class" INTEGER NOT NULL,
    "study_mode" "Study_mode",
    "institution" TEXT,
    "phone" BIGINT,
    "phone_country_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam" (
    "id" TEXT NOT NULL,
    "name" "ExamName" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" "SubjectName" NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "class" INTEGER NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "papers" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "session" TEXT NOT NULL,
    "shift" TEXT,
    "totalMarks" INTEGER NOT NULL,
    "totalDuration" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "totalSingleChoice" INTEGER NOT NULL DEFAULT 0,
    "totalMultiChoice" INTEGER NOT NULL DEFAULT 0,
    "totalInteger" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "papers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprehension" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,

    CONSTRAINT "comprehension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "comprehensionId" TEXT,
    "questionNumber" INTEGER NOT NULL,
    "english_text" TEXT NOT NULL,
    "hindi_text" TEXT,
    "image" TEXT[],
    "type" "questionType" NOT NULL,
    "positiveMarks" INTEGER NOT NULL,
    "negativeMarks" INTEGER NOT NULL,
    "correctAnswer" TEXT[],

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionAtext" TEXT,
    "optionAimage" TEXT,
    "optionBtext" TEXT,
    "optionBimage" TEXT,
    "optionCtext" TEXT,
    "optionCimage" TEXT,
    "optionDtext" TEXT,
    "optionDimage" TEXT,

    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solution" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "videoUrl" TEXT,
    "imageUrl" TEXT,

    CONSTRAINT "solution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_password_key" ON "user"("password");

-- CreateIndex
CREATE UNIQUE INDEX "user_refersh_token_key" ON "user"("refersh_token");

-- CreateIndex
CREATE UNIQUE INDEX "student_profile_user_id_key" ON "student_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profile_phone_key" ON "student_profile"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "exam_name_key" ON "exam"("name");

-- CreateIndex
CREATE UNIQUE INDEX "papers_examId_year_session_shift_key" ON "papers"("examId", "year", "session", "shift");

-- CreateIndex
CREATE UNIQUE INDEX "questions_paperId_questionNumber_key" ON "questions"("paperId", "questionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "options_questionId_key" ON "options"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "solution_questionId_key" ON "solution"("questionId");

-- AddForeignKey
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "papers" ADD CONSTRAINT "papers_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprehension" ADD CONSTRAINT "comprehension_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprehension" ADD CONSTRAINT "comprehension_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_comprehensionId_fkey" FOREIGN KEY ("comprehensionId") REFERENCES "comprehension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solution" ADD CONSTRAINT "solution_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
