import { StudyTimerStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const activeStudyTimerStatuses = [
  StudyTimerStatus.RUNNING,
  StudyTimerStatus.PAUSED,
];

let ensureStoragePromise: Promise<void> | null = null;

export async function studyTimerStorageReady() {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT to_regclass('public."StudyTimer"') IS NOT NULL AS "exists"
  `;

  return rows[0]?.exists ?? false;
}

export async function ensureStudyTimerStorage() {
  ensureStoragePromise ??= ensureStudyTimerStorageInternal().catch((error) => {
    ensureStoragePromise = null;
    throw error;
  });

  return ensureStoragePromise;
}

async function ensureStudyTimerStorageInternal() {
  if (await studyTimerStorageReady()) return;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext('estuda2_study_timer_storage'))
    `;

    const rows = await tx.$queryRaw<{ exists: boolean }[]>`
      SELECT to_regclass('public."StudyTimer"') IS NOT NULL AS "exists"
    `;
    if (rows[0]?.exists) return;

    await tx.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StudyTimerStatus') THEN
          CREATE TYPE "StudyTimerStatus" AS ENUM ('RUNNING', 'PAUSED', 'FINISHED', 'CANCELLED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StudyTimerMode') THEN
          CREATE TYPE "StudyTimerMode" AS ENUM ('FREE');
        END IF;
      END $$;
    `);

    await tx.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StudyTimer" (
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
    `);

    await tx.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StudyTimer_userId_status_idx" ON "StudyTimer"("userId", "status")
    `);
    await tx.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StudyTimer_examId_status_idx" ON "StudyTimer"("examId", "status")
    `);
    await tx.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StudyTimer_subjectId_idx" ON "StudyTimer"("subjectId")
    `);
    await tx.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StudyTimer_topicId_idx" ON "StudyTimer"("topicId")
    `);

    await tx.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudyTimer_userId_fkey') THEN
          ALTER TABLE "StudyTimer" ADD CONSTRAINT "StudyTimer_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudyTimer_examId_fkey') THEN
          ALTER TABLE "StudyTimer" ADD CONSTRAINT "StudyTimer_examId_fkey"
          FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudyTimer_subjectId_fkey') THEN
          ALTER TABLE "StudyTimer" ADD CONSTRAINT "StudyTimer_subjectId_fkey"
          FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudyTimer_topicId_fkey') THEN
          ALTER TABLE "StudyTimer" ADD CONSTRAINT "StudyTimer_topicId_fkey"
          FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
  });
}

export async function findActiveStudyTimer(params: {
  examId: string;
  userId: string;
}) {
  await ensureStudyTimerStorage();

  return prisma.studyTimer.findFirst({
    where: {
      examId: params.examId,
      userId: params.userId,
      status: {
        in: activeStudyTimerStatuses,
      },
    },
    orderBy: { startedAt: "desc" },
    include: {
      subject: true,
      topic: { include: { parent: true } },
    },
  });
}
