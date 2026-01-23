/*
  Warnings:

  - The values [ATTEMPTING,CORRECT,WRONG] on the enum `AttemptStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AttemptStatus_new" AS ENUM ('ANSWERED', 'NOT_ANSWERED', 'MARKED_FOR_REVIEW', 'ANSWERED_AND_MARKED_FOR_REVIEW');
ALTER TABLE "public"."testQuestionAttemptStatus" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "testQuestionAttemptStatus" ALTER COLUMN "status" TYPE "AttemptStatus_new" USING ("status"::text::"AttemptStatus_new");
ALTER TABLE "chapterWiseQuestionAttemptStatus" ALTER COLUMN "questionStatus" TYPE "AttemptStatus_new" USING ("questionStatus"::text::"AttemptStatus_new");
ALTER TYPE "AttemptStatus" RENAME TO "AttemptStatus_old";
ALTER TYPE "AttemptStatus_new" RENAME TO "AttemptStatus";
DROP TYPE "public"."AttemptStatus_old";
ALTER TABLE "testQuestionAttemptStatus" ALTER COLUMN "status" SET DEFAULT 'NOT_ANSWERED';
COMMIT;

-- AlterTable
ALTER TABLE "testQuestionAttemptStatus" ALTER COLUMN "status" SET DEFAULT 'NOT_ANSWERED';
