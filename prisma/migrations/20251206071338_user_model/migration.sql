-- CreateEnum
CREATE TYPE "ExamName" AS ENUM ('JEE_MAIN', 'JEE_ADVANCED');

-- CreateEnum
CREATE TYPE "Study_mode" AS ENUM ('online', 'offline', 'self');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_verified" BOOLEAN NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "class" INTEGER NOT NULL,
    "study_mode" "Study_mode",
    "institution" TEXT,
    "phone" BIGINT,
    "phone_country_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam" (
    "id" TEXT NOT NULL,
    "name" "ExamName" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_password_key" ON "user"("password");

-- CreateIndex
CREATE UNIQUE INDEX "user_refresh_token_key" ON "user"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "student_profile_user_id_key" ON "student_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profile_phone_key" ON "student_profile"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "exam_name_key" ON "exam"("name");

-- AddForeignKey
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
