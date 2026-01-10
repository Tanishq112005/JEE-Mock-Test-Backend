/*
  Warnings:

  - The values [MatchTheFollowing] on the enum `questionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `comprehensionId` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `english_text` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `hindi_text` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `solution` table. All the data in the column will be lost.
  - You are about to drop the `comprehension` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `content` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "questionType_new" AS ENUM ('SingleCorrect', 'MultiCorrect', 'Integer', 'Comprehension');
ALTER TABLE "questions" ALTER COLUMN "type" TYPE "questionType_new" USING ("type"::text::"questionType_new");
ALTER TYPE "questionType" RENAME TO "questionType_old";
ALTER TYPE "questionType_new" RENAME TO "questionType";
DROP TYPE "public"."questionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "comprehension" DROP CONSTRAINT "comprehension_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "comprehension" DROP CONSTRAINT "comprehension_paperId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_comprehensionId_fkey";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "comprehensionId",
DROP COLUMN "english_text",
DROP COLUMN "hindi_text",
ADD COLUMN     "content" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "solution" DROP COLUMN "imageUrl",
ADD COLUMN     "image" TEXT[];

-- DropTable
DROP TABLE "comprehension";
