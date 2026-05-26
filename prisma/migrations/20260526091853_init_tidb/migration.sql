-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `type` ENUM('Student', 'Developer') NOT NULL DEFAULT 'Student',
    `password` VARCHAR(191) NOT NULL,
    `refersh_token` VARCHAR(191) NULL,
    `lastVisited` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_verified` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `user_email_key`(`email`),
    UNIQUE INDEX `user_password_key`(`password`),
    UNIQUE INDEX `user_refersh_token_key`(`refersh_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studentProfile` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `class` ENUM('class_12', 'class_11', 'Dropper', 'class_10_or_below') NULL,
    `category` ENUM('General', 'General_PwD', 'General_EWS', 'General_EWS_PwD', 'OBC_NCL', 'OBC_NCL_PwD', 'SC', 'SC_PwD', 'ST', 'ST_PwD') NULL,
    `phone` BIGINT NULL,
    `phone_country_code` VARCHAR(191) NULL,
    `gender` ENUM('Male', 'Female', 'Other') NULL,
    `streak` INTEGER NOT NULL DEFAULT 0,
    `maximumStreak` INTEGER NOT NULL DEFAULT 0,
    `globalRank` INTEGER NOT NULL DEFAULT 1,
    `stage` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `studentProfile_user_id_key`(`user_id`),
    UNIQUE INDEX `studentProfile_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam` (
    `id` VARCHAR(191) NOT NULL,
    `name` ENUM('JEE_MAIN', 'JEE_ADVANCED') NOT NULL,

    UNIQUE INDEX `exam_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` VARCHAR(191) NOT NULL,
    `name` ENUM('Physics', 'Chemistry', 'Mathematics') NOT NULL,
    `totalQuestion` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `subjects_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chapters` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `group` VARCHAR(191) NOT NULL,
    `class` INTEGER NOT NULL,
    `chapterNumber` INTEGER NOT NULL,
    `isJeeMain` BOOLEAN NOT NULL DEFAULT false,
    `isJeeAdvanced` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `chapters_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `papers` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `year` INTEGER NULL,
    `mode` ENUM('online', 'offline') NOT NULL,
    `month` ENUM('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December') NOT NULL,
    `day` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `shift` ENUM('Paper_1', 'Paper_2', 'Morning', 'Evening') NOT NULL,
    `session` ENUM('Session_1', 'Session_2', 'Advanced', 'Not_Assign') NOT NULL DEFAULT 'Not_Assign',
    `totalMarks` INTEGER NULL DEFAULT 0,
    `totalDuration` INTEGER NULL DEFAULT 0,
    `totalQuestions` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paperMarkingScheme` (
    `id` VARCHAR(191) NOT NULL,
    `paperId` VARCHAR(191) NOT NULL,
    `questionType` ENUM('SingleCorrect', 'MultiCorrect', 'Integer', 'ComprehensionSingleCorrect', 'ComprehensionMultiCorrect', 'ComprehensionInteger') NOT NULL,
    `positiveMarks` INTEGER NOT NULL,
    `negativeMarks` INTEGER NOT NULL,
    `isPartial` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `paperMarkingScheme_paperId_questionType_key`(`paperId`, `questionType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `chapterId` VARCHAR(191) NULL,
    `paperId` VARCHAR(191) NULL,
    `class` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `image` JSON NULL,
    `type` ENUM('SingleCorrect', 'MultiCorrect', 'Integer', 'ComprehensionSingleCorrect', 'ComprehensionMultiCorrect', 'ComprehensionInteger') NOT NULL,
    `questionNumber` INTEGER NOT NULL,
    `comprehensionContent` TEXT NULL,
    `comprehensionImage` JSON NULL,
    `positiveMarks` INTEGER NOT NULL,
    `negativeMarks` INTEGER NOT NULL,
    `isOutOfSyllabus` BOOLEAN NOT NULL DEFAULT false,
    `isBonus` BOOLEAN NOT NULL DEFAULT false,
    `correctAnswer` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `options` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `optionAtext` TEXT NULL,
    `optionAimage` JSON NULL,
    `optionBtext` TEXT NULL,
    `optionBimage` JSON NULL,
    `optionCtext` TEXT NULL,
    `optionCimage` JSON NULL,
    `optionDtext` VARCHAR(191) NULL,

    UNIQUE INDEX `options_questionId_key`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solution` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `videoUrl` VARCHAR(191) NULL,
    `image` JSON NULL,

    UNIQUE INDEX `solution_questionId_key`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testStatus` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `paperId` VARCHAR(191) NOT NULL,
    `status` ENUM('IN_PROGRESS', 'PAUSED', 'COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
    `timeLeft` INTEGER NOT NULL,
    `activeQuestionId` VARCHAR(191) NULL,
    `isAnalyzed` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `activeSection` VARCHAR(191) NULL,

    UNIQUE INDEX `testStatus_paperId_created_at_key`(`paperId`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testQuestionAttemptStatus` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `testStatusId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('answered', 'notAnswered', 'markedForReview', 'visited') NOT NULL DEFAULT 'notAnswered',
    `marksObtained` DOUBLE NOT NULL DEFAULT 0.0,
    `timeSpent` INTEGER NOT NULL,
    `userAnswer` JSON NULL,
    `isVisited` BOOLEAN NOT NULL DEFAULT false,
    `markedForReview` BOOLEAN NOT NULL DEFAULT false,
    `isAnalyzed` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `testQuestionAttemptStatus_questionId_testStatusId_key`(`questionId`, `testStatusId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chapterWiseQuestionAttemptStatus` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `questionStatus` ENUM('answered', 'notAnswered', 'markedForReview', 'visited') NOT NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `marksObtained` DOUBLE NOT NULL DEFAULT 0.0,
    `timeSpent` INTEGER NOT NULL,
    `userAnswer` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isAnalyzed` BOOLEAN NOT NULL DEFAULT false,

    INDEX `chapterWiseQuestionAttemptStatus_studentId_questionId_create_idx`(`studentId`, `questionId`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentOverallAnalytics` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `practiceAttempts` INTEGER NOT NULL DEFAULT 0,
    `practiceTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `practiceMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `practiceMaxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `uniquePracticeAttempts` INTEGER NOT NULL DEFAULT 0,
    `testAttempts` INTEGER NOT NULL DEFAULT 0,
    `testTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `testMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `testMaxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `uniqueTestAttempts` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StudentOverallAnalytics_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubjectAnalytics` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `practiceAttempts` INTEGER NOT NULL DEFAULT 0,
    `practiceTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `practiceMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `practiceMaxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `testAttempts` INTEGER NOT NULL DEFAULT 0,
    `testTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `testMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `testMaxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SubjectAnalytics_studentId_subjectId_key`(`studentId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChapterAnalytics` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `chapterId` VARCHAR(191) NOT NULL,
    `practiceJeeMainAttempts` INTEGER NOT NULL DEFAULT 0,
    `practiceJeeMainTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `practiceJeeMainMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `practiceJeeMainMaxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `practiceJeeMainCorrect` INTEGER NOT NULL DEFAULT 0,
    `practiceJeeMainWrong` INTEGER NOT NULL DEFAULT 0,
    `practiceJeeMainPartial` INTEGER NOT NULL DEFAULT 0,
    `practiceJeeAdvancedAttempts` INTEGER NOT NULL DEFAULT 0,
    `practiceJeeAdvancedTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `practiceJeeAdvancedMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `practiceJeeAdvancedMaxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `practiceJeeAdvancedCorrect` INTEGER NOT NULL DEFAULT 0,
    `practiceJeeAdvancedWrong` INTEGER NOT NULL DEFAULT 0,
    `practiceJeeAdvancedPartial` INTEGER NOT NULL DEFAULT 0,
    `testJeeMainAttempts` INTEGER NOT NULL DEFAULT 0,
    `testJeeMainTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `testJeeMainMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `testJeeMainMaxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `testJeeMainCorrect` INTEGER NOT NULL DEFAULT 0,
    `testJeeMainWrong` INTEGER NOT NULL DEFAULT 0,
    `testJeeMainPartial` INTEGER NOT NULL DEFAULT 0,
    `testJeeAdvancedAttempts` INTEGER NOT NULL DEFAULT 0,
    `testJeeAdvancedTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `testJeeAdvancedMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `testJeeAdvancedMaxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `testJeeAdvancedCorrect` INTEGER NOT NULL DEFAULT 0,
    `testJeeAdvancedWrong` INTEGER NOT NULL DEFAULT 0,
    `testJeeAdvancedPartial` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ChapterAnalytics_studentId_chapterId_key`(`studentId`, `chapterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestChapterAnalytics` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `chapterId` VARCHAR(191) NOT NULL,
    `testStatusId` VARCHAR(191) NOT NULL,
    `examName` ENUM('JEE_MAIN', 'JEE_ADVANCED') NOT NULL,
    `chapterName` VARCHAR(191) NOT NULL,
    `subjectName` VARCHAR(191) NOT NULL,
    `totalQuestions` INTEGER NOT NULL,
    `attempt` INTEGER NOT NULL DEFAULT 0,
    `correct` INTEGER NOT NULL DEFAULT 0,
    `partial` INTEGER NOT NULL DEFAULT 0,
    `wrong` INTEGER NOT NULL DEFAULT 0,
    `marksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `maxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `positiveMarks` DOUBLE NOT NULL DEFAULT 0.0,
    `partialMarks` DOUBLE NOT NULL DEFAULT 0.0,
    `negativeMarks` DOUBLE NOT NULL DEFAULT 0.0,
    `timeTaken` INTEGER NOT NULL DEFAULT 0,
    `accuracy` DOUBLE NOT NULL DEFAULT 0.0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TestChapterAnalytics_studentId_chapterId_testStatusId_key`(`studentId`, `chapterId`, `testStatusId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamAnalytics` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `examName` ENUM('JEE_MAIN', 'JEE_ADVANCED') NOT NULL,
    `practiceAttempts` INTEGER NOT NULL DEFAULT 0,
    `practiceTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `practiceMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `practiceMaxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `testAttempts` INTEGER NOT NULL DEFAULT 0,
    `testTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `testMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `testMaxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `testsCompleted` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ExamAnalytics_studentId_examName_key`(`studentId`, `examName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentQuestionAnalytics` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `questioType` ENUM('SingleCorrect', 'MultiCorrect', 'Integer', 'ComprehensionSingleCorrect', 'ComprehensionMultiCorrect', 'ComprehensionInteger') NOT NULL,
    `practiceAttempts` INTEGER NOT NULL DEFAULT 0,
    `practiceTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `practiceMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `practiceMaxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `testAttempts` INTEGER NOT NULL DEFAULT 0,
    `testTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `testMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `testMaxPossible` DOUBLE NOT NULL DEFAULT 0.0,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StudentQuestionAnalytics_studentId_questioType_key`(`studentId`, `questioType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestAttemptSummary` (
    `id` VARCHAR(191) NOT NULL,
    `testStatusId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `totalScore` DOUBLE NOT NULL,
    `maxScore` DOUBLE NOT NULL,
    `percentage` DOUBLE NOT NULL,
    `accuracy` DOUBLE NOT NULL,
    `avgTimePerQ` DOUBLE NOT NULL DEFAULT 0.0,
    `timeTaken` INTEGER NOT NULL,
    `chapterSplits` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TestAttemptSummary_testStatusId_key`(`testStatusId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubjectTestResult` (
    `id` VARCHAR(191) NOT NULL,
    `summaryId` VARCHAR(191) NOT NULL,
    `subjectName` ENUM('Physics', 'Chemistry', 'Mathematics') NOT NULL,
    `totalQuestions` INTEGER NOT NULL,
    `attempted` INTEGER NOT NULL,
    `correct` INTEGER NOT NULL,
    `partial` INTEGER NOT NULL,
    `wrong` INTEGER NOT NULL,
    `marks` DOUBLE NOT NULL,
    `maxMarks` DOUBLE NOT NULL DEFAULT 0.0,
    `positiveMarks` DOUBLE NOT NULL,
    `partialMarks` DOUBLE NOT NULL,
    `negativeMarks` DOUBLE NOT NULL,
    `timeTaken` INTEGER NOT NULL,
    `accuracy` DOUBLE NOT NULL,

    UNIQUE INDEX `SubjectTestResult_summaryId_subjectName_key`(`summaryId`, `subjectName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionTypeTestResult` (
    `id` VARCHAR(191) NOT NULL,
    `summaryId` VARCHAR(191) NOT NULL,
    `questionType` ENUM('SingleCorrect', 'MultiCorrect', 'Integer', 'ComprehensionSingleCorrect', 'ComprehensionMultiCorrect', 'ComprehensionInteger') NOT NULL,
    `totalQuestions` INTEGER NOT NULL,
    `attempted` INTEGER NOT NULL,
    `correct` INTEGER NOT NULL,
    `partial` INTEGER NOT NULL,
    `wrong` INTEGER NOT NULL,
    `marks` DOUBLE NOT NULL,
    `maxMarks` DOUBLE NOT NULL DEFAULT 0.0,
    `positiveMarks` DOUBLE NOT NULL,
    `partialMarks` DOUBLE NOT NULL,
    `negativeMarks` DOUBLE NOT NULL,
    `timeTaken` INTEGER NOT NULL,
    `accuracy` DOUBLE NOT NULL,

    UNIQUE INDEX `QuestionTypeTestResult_summaryId_questionType_key`(`summaryId`, `questionType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaperGlobalStats` (
    `id` VARCHAR(191) NOT NULL,
    `paperId` VARCHAR(191) NOT NULL,
    `totalAttempts` INTEGER NOT NULL DEFAULT 0,
    `averageScore` DOUBLE NOT NULL DEFAULT 0.0,
    `highestScore` DOUBLE NOT NULL DEFAULT 0.0,
    `averageTimeTaken` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PaperGlobalStats_paperId_key`(`paperId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionGlobalStats` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `totalAttemptsInPratice` INTEGER NOT NULL DEFAULT 0,
    `totalTimeSpentInPratice` INTEGER NOT NULL DEFAULT 0,
    `totalMarksEarnedInPratice` DOUBLE NOT NULL DEFAULT 0.0,
    `maxPossibleMarksEarnedInPratice` DOUBLE NOT NULL DEFAULT 0.0,
    `leastTimeInPratice` DOUBLE NOT NULL DEFAULT 0.0,
    `totalAttempts` INTEGER NOT NULL DEFAULT 0,
    `totalTimeSpent` INTEGER NOT NULL DEFAULT 0,
    `totalMarksEarned` DOUBLE NOT NULL DEFAULT 0.0,
    `maxPossibleMarks` DOUBLE NOT NULL DEFAULT 0.0,
    `leastTimeInTest` DOUBLE NOT NULL DEFAULT 0.0,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `QuestionGlobalStats_questionId_key`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `questionsSolved` INTEGER NOT NULL DEFAULT 0,
    `questionsCorrect` INTEGER NOT NULL DEFAULT 0,
    `testsTaken` INTEGER NOT NULL DEFAULT 0,
    `timeSpent` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `DailyActivityLog_studentId_date_key`(`studentId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookmarkedQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bookmarkedQuestion_studentId_questionId_key`(`studentId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Email` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Email_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `studentProfile` ADD CONSTRAINT `studentProfile_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapters` ADD CONSTRAINT `chapters_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `papers` ADD CONSTRAINT `papers_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paperMarkingScheme` ADD CONSTRAINT `paperMarkingScheme_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `options` ADD CONSTRAINT `options_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solution` ADD CONSTRAINT `solution_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testStatus` ADD CONSTRAINT `testStatus_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testStatus` ADD CONSTRAINT `testStatus_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testStatus` ADD CONSTRAINT `testStatus_activeQuestionId_fkey` FOREIGN KEY (`activeQuestionId`) REFERENCES `questions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testQuestionAttemptStatus` ADD CONSTRAINT `testQuestionAttemptStatus_testStatusId_fkey` FOREIGN KEY (`testStatusId`) REFERENCES `testStatus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testQuestionAttemptStatus` ADD CONSTRAINT `testQuestionAttemptStatus_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testQuestionAttemptStatus` ADD CONSTRAINT `testQuestionAttemptStatus_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapterWiseQuestionAttemptStatus` ADD CONSTRAINT `chapterWiseQuestionAttemptStatus_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapterWiseQuestionAttemptStatus` ADD CONSTRAINT `chapterWiseQuestionAttemptStatus_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentOverallAnalytics` ADD CONSTRAINT `StudentOverallAnalytics_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubjectAnalytics` ADD CONSTRAINT `SubjectAnalytics_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubjectAnalytics` ADD CONSTRAINT `SubjectAnalytics_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChapterAnalytics` ADD CONSTRAINT `ChapterAnalytics_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChapterAnalytics` ADD CONSTRAINT `ChapterAnalytics_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestChapterAnalytics` ADD CONSTRAINT `TestChapterAnalytics_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestChapterAnalytics` ADD CONSTRAINT `TestChapterAnalytics_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `chapters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestChapterAnalytics` ADD CONSTRAINT `TestChapterAnalytics_studentId_chapterId_fkey` FOREIGN KEY (`studentId`, `chapterId`) REFERENCES `ChapterAnalytics`(`studentId`, `chapterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamAnalytics` ADD CONSTRAINT `ExamAnalytics_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentQuestionAnalytics` ADD CONSTRAINT `StudentQuestionAnalytics_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestAttemptSummary` ADD CONSTRAINT `TestAttemptSummary_testStatusId_fkey` FOREIGN KEY (`testStatusId`) REFERENCES `testStatus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestAttemptSummary` ADD CONSTRAINT `TestAttemptSummary_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubjectTestResult` ADD CONSTRAINT `SubjectTestResult_summaryId_fkey` FOREIGN KEY (`summaryId`) REFERENCES `TestAttemptSummary`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionTypeTestResult` ADD CONSTRAINT `QuestionTypeTestResult_summaryId_fkey` FOREIGN KEY (`summaryId`) REFERENCES `TestAttemptSummary`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaperGlobalStats` ADD CONSTRAINT `PaperGlobalStats_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionGlobalStats` ADD CONSTRAINT `QuestionGlobalStats_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyActivityLog` ADD CONSTRAINT `DailyActivityLog_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarkedQuestion` ADD CONSTRAINT `bookmarkedQuestion_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarkedQuestion` ADD CONSTRAINT `bookmarkedQuestion_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `studentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
