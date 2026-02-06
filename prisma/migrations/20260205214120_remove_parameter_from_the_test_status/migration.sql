/*
  Warnings:

  - You are about to drop the column `paperOver` on the `testStatus` table. All the data in the column will be lost.
  - Added the required column `submit_at` to the `chapterWiseQuestionAttemptStatus` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "chapterWiseQuestionAttemptStatus_studentId_questionId_idx";

-- AlterTable
ALTER TABLE "chapterWiseQuestionAttemptStatus" ADD COLUMN     "submit_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "testStatus" DROP COLUMN "paperOver";

-- CreateIndex
CREATE INDEX "chapterWiseQuestionAttemptStatus_studentId_questionId_creat_idx" ON "chapterWiseQuestionAttemptStatus"("studentId", "questionId", "created_at");
