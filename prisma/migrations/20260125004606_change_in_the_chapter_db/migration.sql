/*
  Warnings:

  - You are about to drop the column `chapterNumber` on the `chapters` table. All the data in the column will be lost.
  - Added the required column `group` to the `chapters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chapters" DROP COLUMN "chapterNumber",
ADD COLUMN     "group" TEXT NOT NULL;
