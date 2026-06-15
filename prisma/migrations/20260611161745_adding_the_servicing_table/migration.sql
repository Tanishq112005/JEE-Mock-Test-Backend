-- CreateTable
CREATE TABLE `servicing` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `isServicing` BOOLEAN NOT NULL DEFAULT false,
    `reason` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
