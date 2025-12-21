-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('ATTEMPTING', 'CORRECT', 'WRONG');

-- CreateTable
CREATE TABLE "testResults" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "PositiveMarks" INTEGER NOT NULL,
    "NegativeMarks" INTEGER NOT NULL,
    "totalAttempt" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testResults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAttempt" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL,
    "userAnswer" TEXT[],

    CONSTRAINT "QuestionAttempt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "testResults" ADD CONSTRAINT "testResults_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testResults" ADD CONSTRAINT "testResults_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
