-- CreateTable
CREATE TABLE `userNotifications` (
    `id` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sendingMedium` JSON NOT NULL,
    `from` ENUM('User', 'Developer') NOT NULL,
    `to` ENUM('User', 'Developer') NOT NULL,
    `type` ENUM('TechnicalGlitch', 'Update', 'Review', 'VerificationEmail', 'ForgotPassword') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `userNotifications` ADD CONSTRAINT `userNotifications_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
