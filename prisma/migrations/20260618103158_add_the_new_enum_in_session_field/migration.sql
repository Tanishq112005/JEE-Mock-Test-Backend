-- AlterTable
ALTER TABLE `papers` MODIFY `session` ENUM('Session_1', 'Session_2', 'Session_3', 'Session_4', 'Session', 'Advanced', 'Not_Assign') NOT NULL DEFAULT 'Not_Assign';
