/*
  Warnings:

  - The values [ANSWERED,NOT_ANSWERED,MARKED_FOR_REVIEW,ANSWERED_AND_MARKED_FOR_REVIEW] on the enum `AttemptStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isVisited` on the `testQuestionAttemptStatus` table. All the data in the column will be lost.
  - You are about to drop the column `markedForReview` on the `testQuestionAttemptStatus` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AttemptStatus_new" AS ENUM ('answered', 'notAnswered', 'markedForReview', 'answerAndMarkedForReview', 'visited', 'notVisited');
ALTER TABLE "public"."testQuestionAttemptStatus" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "testQuestionAttemptStatus" ALTER COLUMN "status" TYPE "AttemptStatus_new" USING ("status"::text::"AttemptStatus_new");
ALTER TABLE "chapterWiseQuestionAttemptStatus" ALTER COLUMN "questionStatus" TYPE "AttemptStatus_new" USING ("questionStatus"::text::"AttemptStatus_new");
ALTER TYPE "AttemptStatus" RENAME TO "AttemptStatus_old";
ALTER TYPE "AttemptStatus_new" RENAME TO "AttemptStatus";
DROP TYPE "public"."AttemptStatus_old";
ALTER TABLE "testQuestionAttemptStatus" ALTER COLUMN "status" SET DEFAULT 'notAnswered';
COMMIT;

-- AlterTable
ALTER TABLE "testQuestionAttemptStatus" DROP COLUMN "isVisited",
DROP COLUMN "markedForReview",
ALTER COLUMN "status" SET DEFAULT 'notAnswered';
