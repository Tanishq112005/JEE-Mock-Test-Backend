/*
  Warnings:

  - The values [markedForReview,answerAndMarkedForReview,visited,notVisited] on the enum `AttemptStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AttemptStatus_new" AS ENUM ('answered', 'notAnswered');
ALTER TABLE "public"."testQuestionAttemptStatus" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "testQuestionAttemptStatus" ALTER COLUMN "status" TYPE "AttemptStatus_new" USING ("status"::text::"AttemptStatus_new");
ALTER TABLE "chapterWiseQuestionAttemptStatus" ALTER COLUMN "questionStatus" TYPE "AttemptStatus_new" USING ("questionStatus"::text::"AttemptStatus_new");
ALTER TYPE "AttemptStatus" RENAME TO "AttemptStatus_old";
ALTER TYPE "AttemptStatus_new" RENAME TO "AttemptStatus";
DROP TYPE "public"."AttemptStatus_old";
ALTER TABLE "testQuestionAttemptStatus" ALTER COLUMN "status" SET DEFAULT 'notAnswered';
COMMIT;

-- AlterTable
ALTER TABLE "testQuestionAttemptStatus" ADD COLUMN     "isVisited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "markedForReview" BOOLEAN NOT NULL DEFAULT false;
