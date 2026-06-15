import type { Prisma } from "@prisma/client";

import { DataFilters } from "@/components/data-filters";
import { PageHeading } from "@/components/page-heading";
import { getWorkspace } from "@/lib/data";
import {
  parsePeriod,
  parseScope,
  periodLabel,
  periodStart,
} from "@/lib/data-filters";
import { minutesToLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Relatórios",
};

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<{
    period?: string;
    scope?: string;
    subject?: string;
  }>;
};

export default async function ReportsPage({
  searchParams,
}: ReportsPageProps) {
  const query = await searchParams;
  const workspace = await getWorkspace();
  const period = parsePeriod(query.period);
  const scope = parseScope(query.scope);
  const start = periodStart(period);
  const subjectId = workspace.subjects.some(
    (subject) => subject.id === query.subject,
  )
    ? query.subject
    : undefined;
  const commonWhere = {
    examId: workspace.id,
    ...(scope === "mine" ? { userId: workspace.currentUser.id } : {}),
    ...(subjectId ? { subjectId } : {}),
  };
  const sessionWhere = {
    ...commonWhere,
    ...(start ? { studiedAt: { gte: start } } : {}),
  } satisfies Prisma.StudySessionWhereInput;
  const questionWhere = {
    ...commonWhere,
    ...(start ? { answeredAt: { gte: start } } : {}),
  } satisfies Prisma.QuestionLogWhereInput;
  const [sessionTotals, questionTotals, sessionCount] = await Promise.all([
    prisma.studySession.groupBy({
      by: ["subjectId"],
      where: sessionWhere,
      _sum: { durationMinutes: true },
    }),
    prisma.questionLog.groupBy({
      by: ["subjectId"],
      where: questionWhere,
      _sum: { questionsAnswered: true, correctAnswers: true },
    }),
    prisma.studySession.count({ where: sessionWhere }),
  ]);
  const sessionsBySubject = new Map(
    sessionTotals.map((item) => [item.subjectId, item._sum.durationMinutes ?? 0]),
  );
  const questionsBySubject = new Map(
    questionTotals.map((item) => [
      item.subjectId,
      {
        answered: item._sum.questionsAnswered ?? 0,
        correct: item._sum.correctAnswers ?? 0,
      },
    ]),
  );
  const reportSubjects = subjectId
    ? workspace.subjects.filter((subject) => subject.id === subjectId)
    : workspace.subjects;
  const rows = reportSubjects
    .map((subject) => {
      const questions = questionsBySubject.get(subject.id) ?? {
        answered: 0,
        correct: 0,
      };
      return {
        ...subject,
        minutes: sessionsBySubject.get(subject.id) ?? 0,
        ...questions,
        accuracy: questions.answered
          ? Math.round((questions.correct / questions.answered) * 100)
          : 0,
      };
    })
    .filter(
      (row) =>
        Boolean(subjectId) ||
        !row.archivedAt ||
        row.minutes > 0 ||
        row.answered > 0,
    )
    .sort((first, second) => second.minutes - first.minutes);
  const totalMinutes = rows.reduce((total, row) => total + row.minutes, 0);
  const totalAnswered = rows.reduce((total, row) => total + row.answered, 0);
  const totalCorrect = rows.reduce((total, row) => total + row.correct, 0);
  const totalAccuracy = totalAnswered
    ? Math.round((totalCorrect / totalAnswered) * 100)
    : 0;
  const maxMinutes = Math.max(...rows.map((row) => row.minutes), 60);
  const scopeLabel =
    scope === "mine" ? workspace.currentUser.name : "Toda a dupla";

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Análise"
        title="Relatórios"
        description="Filtre o período e descubra onde o esforço está gerando resultado."
      />

      <DataFilters
        basePath="/relatorios"
        period={period}
        scope={scope}
        subjectId={subjectId}
        subjects={workspace.subjects}
        exportTypes={[
          { type: "sessoes", label: "Exportar sessões" },
          { type: "questoes", label: "Exportar questões" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{periodLabel(period)}</span>
        <span>{scopeLabel}</span>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Tempo estudado</p>
          <p className="mt-2 text-2xl font-bold">{minutesToLabel(totalMinutes)}</p>
        </article>
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Sessões</p>
          <p className="mt-2 text-2xl font-bold">{sessionCount}</p>
        </article>
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Questões resolvidas</p>
          <p className="mt-2 text-2xl font-bold">{totalAnswered}</p>
        </article>
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Aproveitamento</p>
          <p className="mt-2 text-2xl font-bold">{totalAccuracy}%</p>
        </article>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Distribuição por matéria</h2>
        {rows.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum dado encontrado para os filtros escolhidos.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {rows.map((row) => (
              <div key={row.id}>
                <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="text-sm font-semibold">{row.name}</span>
                    {row.archivedAt && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Arquivada
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {minutesToLabel(row.minutes)} · {row.answered} questões ·{" "}
                    {row.accuracy}% de acertos
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: row.color,
                      width: `${(row.minutes / maxMinutes) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
