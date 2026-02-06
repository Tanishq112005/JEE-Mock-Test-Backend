/*
  Warnings:

  - You are about to drop the column `userId` on the `bookmarkedQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `chapterWiseQuestionAttemptStatus` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `testStatus` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,questionId]` on the table `bookmarkedQuestion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,paperId,created_at]` on the table `testStatus` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `studentId` to the `bookmarkedQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `chapterWiseQuestionAttemptStatus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `testStatus` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "bookmarkedQuestion" DROP CONSTRAINT "bookmarkedQuestion_userId_fkey";

-- DropForeignKey
ALTER TABLE "chapterWiseQuestionAttemptStatus" DROP CONSTRAINT "chapterWiseQuestionAttemptStatus_userId_fkey";

-- DropForeignKey
ALTER TABLE "testStatus" DROP CONSTRAINT "testStatus_userId_fkey";

-- DropIndex
DROP INDEX "bookmarkedQuestion_userId_questionId_key";

-- DropIndex
DROP INDEX "chapterWiseQuestionAttemptStatus_userId_questionId_idx";

-- DropIndex
DROP INDEX "testStatus_userId_paperId_created_at_key";

-- AlterTable
ALTER TABLE "bookmarkedQuestion" DROP COLUMN "userId",
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "chapterWiseQuestionAttemptStatus" DROP COLUMN "userId",
ADD COLUMN     "isCorrect" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marksObtained" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "studentProfile" ADD COLUMN     "maximumStreak" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "rank" BIGINT NOT NULL DEFAULT 1,
ADD COLUMN     "streak" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "testStatus" DROP COLUMN "userId",
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "lastVisited" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "paperMarkingScheme" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "questionType" "questionType" NOT NULL,
    "postiveMarks" INTEGER NOT NULL,
    "negativeMarks" INTEGER NOT NULL,
    "isPartial" BOOLEAN NOT NULL,
    "partialPerQuestionMarks" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "paperMarkingScheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paperMarkingScheme_paperId_questionType_key" ON "paperMarkingScheme"("paperId", "questionType");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarkedQuestion_studentId_questionId_key" ON "bookmarkedQuestion"("studentId", "questionId");

-- CreateIndex
CREATE INDEX "chapterWiseQuestionAttemptStatus_studentId_questionId_idx" ON "chapterWiseQuestionAttemptStatus"("studentId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "testStatus_studentId_paperId_created_at_key" ON "testStatus"("studentId", "paperId", "created_at");

-- AddForeignKey
ALTER TABLE "testStatus" ADD CONSTRAINT "testStatus_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapterWiseQuestionAttemptStatus" ADD CONSTRAINT "chapterWiseQuestionAttemptStatus_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarkedQuestion" ADD CONSTRAINT "bookmarkedQuestion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "studentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paperMarkingScheme" ADD CONSTRAINT "paperMarkingScheme_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
