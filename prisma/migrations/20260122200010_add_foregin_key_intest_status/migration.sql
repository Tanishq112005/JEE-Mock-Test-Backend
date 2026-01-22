/*
  Warnings:

  - A unique constraint covering the columns `[userId,paperId,created_at]` on the table `testStatus` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "testStatus_userId_paperId_key";

-- CreateIndex
CREATE UNIQUE INDEX "testStatus_userId_paperId_created_at_key" ON "testStatus"("userId", "paperId", "created_at");

-- AddForeignKey
ALTER TABLE "testStatus" ADD CONSTRAINT "testStatus_activeQuestionId_fkey" FOREIGN KEY ("activeQuestionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
