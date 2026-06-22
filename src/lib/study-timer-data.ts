import { StudyTimerStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const activeStudyTimerStatuses = [
  StudyTimerStatus.RUNNING,
  StudyTimerStatus.PAUSED,
];

export async function studyTimerStorageReady() {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT to_regclass('public."StudyTimer"') IS NOT NULL AS "exists"
  `;

  return rows[0]?.exists ?? false;
}

export async function findActiveStudyTimer(params: {
  examId: string;
  userId: string;
}) {
  if (!(await studyTimerStorageReady())) return null;

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
