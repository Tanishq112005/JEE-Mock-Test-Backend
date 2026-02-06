/*
  Warnings:

  - Added the required column `day` to the `papers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `papers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Day" AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

-- CreateEnum
CREATE TYPE "Month" AS ENUM ('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');

-- AlterTable
ALTER TABLE "papers" ADD COLUMN     "day" "Day" NOT NULL,
ADD COLUMN     "month" "Month" NOT NULL;
