-- AlterTable
ALTER TABLE "User"
ADD COLUMN "login" TEXT,
ADD COLUMN "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "Exam"
ADD COLUMN "weeklyGoalMinutes" INTEGER NOT NULL DEFAULT 300;

-- AlterTable
ALTER TABLE "ExamMembership"
ADD COLUMN "weeklyGoalMinutes" INTEGER;

-- AlterTable
ALTER TABLE "Subject"
ADD COLUMN "weeklyGoalMinutes" INTEGER,
ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");
