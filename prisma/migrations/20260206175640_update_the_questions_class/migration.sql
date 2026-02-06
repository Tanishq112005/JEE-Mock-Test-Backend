/*
  Warnings:

  - Added the required column `class` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "class" INTEGER NOT NULL;
