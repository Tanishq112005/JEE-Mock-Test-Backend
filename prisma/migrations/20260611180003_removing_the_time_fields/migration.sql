/*
  Warnings:

  - You are about to drop the column `endTime` on the `servicing` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `servicing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `servicing` DROP COLUMN `endTime`,
    DROP COLUMN `startTime`;
