import { StudyTimerStatus } from "@prisma/client";

import { ActiveFocusTimer, StartFocusForm } from "@/components/focus-timer";
import { PageHeading } from "@/components/page-heading";
import { getWorkspace } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { reviewIntervalsSummary } from "@/lib/reviews";

export const metadata = {
  title: "Modo Foco",
};

export const dynamic = "force-dynamic";

const activeTimerStatuses = [
  StudyTimerStatus.RUNNING,
  StudyTimerStatus.PAUSED,
];

export default async function FocusPage() {
  const workspace = await getWorkspace();
  const [activeTimer, topics] = await Promise.all([
    prisma.studyTimer.findFirst({
      where: {
        examId: workspace.id,
        userId: workspace.currentUser.id,
        status: { in: activeTimerStatuses },
      },
      orderBy: { startedAt: "desc" },
      include: {
        subject: true,
        topic: { include: { parent: true } },
      },
    }),
    prisma.topic.findMany({
      where: { examId: workspace.id },
      orderBy: [
        { subject: { position: "asc" } },
        { parentId: "asc" },
        { position: "asc" },
        { name: "asc" },
      ],
      include: { subject: true, parent: true },
    }),
  ]);
  const activeSubjects = workspace.subjects.filter(
    (subject) => !subject.archivedAt,
  );
  const activeTopics = topics
    .filter((topic) => !topic.archivedAt && !topic.parent?.archivedAt)
    .map((topic) => ({
      id: topic.id,
      name: topic.name,
      subjectId: topic.subjectId,
      subjectName: topic.subject.name,
      parentName: topic.parent?.name ?? null,
    }));

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Sessão em andamento"
        title="Modo Foco"
        description="Escolha o que vai estudar, acompanhe o tempo líquido e salve a sessão apenas quando revisar o resumo."
      />

      {activeTimer ? (
        <ActiveFocusTimer
          timer={{
            id: activeTimer.id,
            status:
              activeTimer.status === StudyTimerStatus.RUNNING
                ? "RUNNING"
                : "PAUSED",
            startedAt: activeTimer.startedAt.toISOString(),
            lastResumedAt: activeTimer.lastResumedAt.toISOString(),
            pausedAt: activeTimer.pausedAt?.toISOString() ?? null,
            accumulatedSeconds: activeTimer.accumulatedSeconds,
            pauseSeconds: activeTimer.pauseSeconds,
            createReviews: activeTimer.createReviews,
            subject: {
              name: activeTimer.subject.name,
              color: activeTimer.subject.color,
            },
            topic: activeTimer.topic
              ? {
                  name: activeTimer.topic.name,
                  parentName: activeTimer.topic.parent?.name ?? null,
                }
              : null,
          }}
          reviewSummary={reviewIntervalsSummary(workspace.reviewIntervals)}
          reviewMinutes={workspace.reviewMinutes}
        />
      ) : (
        <section className="rounded-[1.75rem] border bg-card p-5 shadow-paper sm:p-6">
          <div>
            <h2 className="text-xl font-semibold">Iniciar sessão de estudo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A matéria é obrigatória antes de iniciar. Assim você não termina
              uma sessão sem classificar o estudo.
            </p>
          </div>
          <div className="mt-6">
            <StartFocusForm
              subjects={activeSubjects}
              topics={activeTopics}
              reviewSummary={reviewIntervalsSummary(workspace.reviewIntervals)}
              reviewMinutes={workspace.reviewMinutes}
            />
          </div>
        </section>
      )}
    </div>
  );
}
