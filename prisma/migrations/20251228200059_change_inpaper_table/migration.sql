/*
  Warnings:

  - The `optionAimage` column on the `options` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `optionBimage` column on the `options` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `optionCimage` column on the `options` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `optionDimage` column on the `options` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `session` column on the `papers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `date` to the `papers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `day` to the `papers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `papers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Day" AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

-- CreateEnum
CREATE TYPE "Month" AS ENUM ('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');

-- CreateEnum
CREATE TYPE "Session" AS ENUM ('Session_1', 'Session_2');

-- AlterTable
ALTER TABLE "options" DROP COLUMN "optionAimage",
ADD COLUMN     "optionAimage" TEXT[],
DROP COLUMN "optionBimage",
ADD COLUMN     "optionBimage" TEXT[],
DROP COLUMN "optionCimage",
ADD COLUMN     "optionCimage" TEXT[],
DROP COLUMN "optionDimage",
ADD COLUMN     "optionDimage" TEXT[];

-- AlterTable
ALTER TABLE "papers" ADD COLUMN     "date" TEXT NOT NULL,
ADD COLUMN     "day" "Day" NOT NULL,
ADD COLUMN     "month" "Month" NOT NULL,
DROP COLUMN "session",
ADD COLUMN     "session" "Session";

-- CreateIndex
CREATE UNIQUE INDEX "papers_examId_year_session_shift_key" ON "papers"("examId", "year", "session", "shift");
