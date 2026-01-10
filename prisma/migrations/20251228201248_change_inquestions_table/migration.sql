/*
  Warnings:

  - Added the required column `isBonus` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isOutOfSyllabus` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "isBonus" BOOLEAN NOT NULL,
ADD COLUMN     "isOutOfSyllabus" BOOLEAN NOT NULL;
