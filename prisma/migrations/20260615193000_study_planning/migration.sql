-- CreateEnum
CREATE TYPE "PlanItemKind" AS ENUM ('STUDY', 'REVIEW');

-- CreateTable
CREATE TABLE "StudyPlanItem" (
    "id" TEXT NOT NULL,
    "kind" "PlanItemKind" NOT NULL DEFAULT 'STUDY',
    "title" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyPlanItem_userId_scheduledFor_idx" ON "StudyPlanItem"("userId", "scheduledFor");

-- CreateIndex
CREATE INDEX "StudyPlanItem_examId_scheduledFor_idx" ON "StudyPlanItem"("examId", "scheduledFor");

-- CreateIndex
CREATE INDEX "StudyPlanItem_subjectId_idx" ON "StudyPlanItem"("subjectId");

-- AddForeignKey
ALTER TABLE "StudyPlanItem" ADD CONSTRAINT "StudyPlanItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanItem" ADD CONSTRAINT "StudyPlanItem_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanItem" ADD CONSTRAINT "StudyPlanItem_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
