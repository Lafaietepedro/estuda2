import { Pencil, Trash2 } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { deleteStudySession } from "@/app/actions";
import { DataFilters } from "@/components/data-filters";
import { PageHeading } from "@/components/page-heading";
import {
  StudySessionEditForm,
  StudySessionForm,
} from "@/components/record-forms";
import { ConfirmSubmitButton } from "@/components/form-controls";
import { getWorkspace } from "@/lib/data";
import {
  parsePeriod,
  parseScope,
  periodLabel,
  periodStart,
} from "@/lib/data-filters";
import { formatDate, formatDateInput, minutesToLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { reviewIntervalsSummary } from "@/lib/reviews";

export const metadata = {
  title: "Sessões",
};

export const dynamic = "force-dynamic";

type SessionsPageProps = {
  searchParams: Promise<{
    period?: string;
    scope?: string;
    subject?: string;
  }>;
};

export default async function SessionsPage({
  searchParams,
}: SessionsPageProps) {
  const query = await searchParams;
  const workspace = await getWorkspace();
  const period = parsePeriod(query.period, "all");
  const scope = parseScope(query.scope);
  const start = periodStart(period);
  const subjectId = workspace.subjects.some(
    (subject) => subject.id === query.subject,
  )
    ? query.subject
    : undefined;
  const where = {
    examId: workspace.id,
    ...(scope === "mine" ? { userId: workspace.currentUser.id } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(start ? { studiedAt: { gte: start } } : {}),
  } satisfies Prisma.StudySessionWhereInput;
  const [sessions, totalSessions] = await Promise.all([
    prisma.studySession.findMany({
      where,
      orderBy: [{ studiedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: { user: true, subject: true, topic: { include: { parent: true } } },
    }),
    prisma.studySession.count({ where }),
  ]);
  const activeSubjects = workspace.subjects.filter(
    (subject) => !subject.archivedAt,
  );
  const topics = await prisma.topic.findMany({
    where: { examId: workspace.id },
    orderBy: [
      { subject: { position: "asc" } },
      { parentId: "asc" },
      { position: "asc" },
      { name: "asc" },
    ],
    include: { subject: true, parent: true },
  });
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
        eyebrow="Rotina"
        title="Sessões de estudo"
        description="Registre o tempo dedicado e mantenha o histórico da dupla em um só lugar."
      />

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Nova sessão</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O registro será vinculado automaticamente a{" "}
          <strong>{workspace.currentUser.name}</strong>.
        </p>
        <div className="mt-5">
          <StudySessionForm
            subjects={activeSubjects}
            topics={activeTopics}
            defaultDate={formatDateInput()}
            reviewSummary={reviewIntervalsSummary(workspace.reviewIntervals)}
            reviewMinutes={workspace.reviewMinutes}
          />
        </div>
      </section>

      <DataFilters
        basePath="/sessoes"
        period={period}
        scope={scope}
        subjectId={subjectId}
        subjects={workspace.subjects}
        exportTypes={[{ type: "sessoes", label: "Exportar sessões" }]}
      />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Histórico</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {periodLabel(period)}
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {totalSessions > 100 ? "100 de " : ""}
            {totalSessions} {totalSessions === 1 ? "registro" : "registros"}
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card px-5 py-12 text-center text-sm text-muted-foreground">
            Nenhuma sessão registrada ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <article
                key={session.id}
                className="relative flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: session.subject.color }}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="font-semibold">{session.subject.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        por {session.user.name}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(session.studiedAt)} ·{" "}
                      {minutesToLabel(session.durationMinutes)}
                    </p>
                    {session.topic && (
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        Tópico:{" "}
                        {session.topic.parent
                          ? `${session.topic.parent.name} > ${session.topic.name}`
                          : session.topic.name}
                      </p>
                    )}
                    {session.notes && (
                      <p className="mt-2 text-sm leading-6">{session.notes}</p>
                    )}
                  </div>
                </div>
                {session.userId === workspace.currentUser.id && (
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <details className="group">
                      <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                        <Pencil className="size-4" aria-hidden="true" />
                        <span className="sr-only">Editar sessão</span>
                      </summary>
                      <div className="mt-3 rounded-xl border bg-muted/30 p-4 sm:absolute sm:right-10 sm:z-20 sm:w-[32rem] sm:bg-card sm:shadow-xl">
                        <StudySessionEditForm
                          session={{
                            id: session.id,
                            subjectId: session.subjectId,
                            topicId: session.topicId ?? "",
                            studiedAt: formatDateInput(session.studiedAt),
                            durationMinutes: session.durationMinutes,
                            notes: session.notes ?? "",
                          }}
                          subjects={workspace.subjects.filter(
                            (subject) =>
                              !subject.archivedAt ||
                              subject.id === session.subjectId,
                          )}
                          topics={topics
                            .filter(
                              (topic) =>
                                !topic.archivedAt ||
                                topic.id === session.topicId,
                            )
                            .map((topic) => ({
                              id: topic.id,
                              name: topic.name,
                              subjectId: topic.subjectId,
                              subjectName: topic.subject.name,
                              parentName: topic.parent?.name ?? null,
                            }))}
                        />
                      </div>
                    </details>
                    <form action={deleteStudySession}>
                      <input type="hidden" name="id" value={session.id} />
                      <ConfirmSubmitButton
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir sessão"
                        className="text-muted-foreground hover:text-destructive"
                        confirmMessage="Excluir esta sessão de estudo? Essa ação não pode ser desfeita."
                      >
                        <Trash2 aria-hidden="true" />
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
