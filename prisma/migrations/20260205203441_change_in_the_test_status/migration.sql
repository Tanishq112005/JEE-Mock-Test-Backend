/*
  Warnings:

  - A unique constraint covering the columns `[paperId,created_at]` on the table `testStatus` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "testStatus_studentId_paperId_created_at_key";

-- CreateIndex
CREATE UNIQUE INDEX "testStatus_paperId_created_at_key" ON "testStatus"("paperId", "created_at");
