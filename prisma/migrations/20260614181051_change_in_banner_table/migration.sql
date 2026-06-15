/*
  Warnings:

  - You are about to drop the `servicing` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `servicing`;

-- CreateTable
CREATE TABLE `banner` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `isbanner` BOOLEAN NOT NULL DEFAULT false,
    `reason` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `type` ENUM('Maintenance', 'Announcement') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
