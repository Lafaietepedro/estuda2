-- AlterTable
ALTER TABLE "Exam" ADD COLUMN "reviewIntervals" TEXT NOT NULL DEFAULT '1,7,30';

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN "reviewMinutes" INTEGER NOT NULL DEFAULT 30;
