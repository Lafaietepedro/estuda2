-- CreateEnum
CREATE TYPE "StudyTimerStatus" AS ENUM ('RUNNING', 'PAUSED', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StudyTimerMode" AS ENUM ('FREE');

-- CreateTable
CREATE TABLE "StudyTimer" (
    "id" TEXT NOT NULL,
    "mode" "StudyTimerMode" NOT NULL DEFAULT 'FREE',
    "status" "StudyTimerStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "lastResumedAt" TIMESTAMP(3) NOT NULL,
    "pausedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "accumulatedSeconds" INTEGER NOT NULL DEFAULT 0,
    "pauseSeconds" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createReviews" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "topicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyTimer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyTimer_userId_status_idx" ON "StudyTimer"("userId", "status");

-- CreateIndex
CREATE INDEX "StudyTimer_examId_status_idx" ON "StudyTimer"("examId", "status");

-- CreateIndex
CREATE INDEX "StudyTimer_subjectId_idx" ON "StudyTimer"("subjectId");

-- CreateIndex
CREATE INDEX "StudyTimer_topicId_idx" ON "StudyTimer"("topicId");

-- AddForeignKey
ALTER TABLE "StudyTimer" ADD CONSTRAINT "StudyTimer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyTimer" ADD CONSTRAINT "StudyTimer_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyTimer" ADD CONSTRAINT "StudyTimer_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyTimer" ADD CONSTRAINT "StudyTimer_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
