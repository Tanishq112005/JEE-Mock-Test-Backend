-- Drop the table safely (since you already removed it manually from TiDB)
DROP TABLE IF EXISTS `banner`;

-- Recreate the table from scratch with the UUID primary key
CREATE TABLE `banner` (
    `id` VARCHAR(191) NOT NULL,
    `isbanner` BOOLEAN NOT NULL DEFAULT false,
    `reason` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `type` ENUM('Maintenance', 'Announcement') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;