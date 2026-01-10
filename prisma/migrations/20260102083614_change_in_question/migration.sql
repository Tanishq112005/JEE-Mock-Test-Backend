/*
  Warnings:

  - Added the required column `subjectId` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "questions_paperId_questionNumber_key";

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "comprehensionContent" TEXT,
ADD COLUMN     "comprehensionImage" TEXT[],
ADD COLUMN     "subjectId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
