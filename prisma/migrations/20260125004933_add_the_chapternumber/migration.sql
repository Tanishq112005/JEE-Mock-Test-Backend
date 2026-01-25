/*
  Warnings:

  - Added the required column `chapterNumber` to the `chapters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chapters" ADD COLUMN     "chapterNumber" INTEGER NOT NULL;
