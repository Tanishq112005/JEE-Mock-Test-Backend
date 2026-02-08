-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "email";

-- CreateTable
CREATE TABLE "email"."Email" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Email_email_key" ON "email"."Email"("email");
