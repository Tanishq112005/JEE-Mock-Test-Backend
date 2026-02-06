/*
  Warnings:

  - Added the required column `questionNumber` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "questionNumber" INTEGER NOT NULL;
