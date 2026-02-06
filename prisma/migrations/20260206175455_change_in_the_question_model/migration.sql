/*
  Warnings:

  - Added the required column `comprehensionContent` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "comprehensionContent" TEXT NOT NULL,
ADD COLUMN     "comprehensionImage" TEXT[];
