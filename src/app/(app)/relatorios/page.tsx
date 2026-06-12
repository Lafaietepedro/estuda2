import { PageHeading } from "@/components/page-heading";
import { getWorkspace } from "@/lib/data";
import { minutesToLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Relatórios",
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const workspace = await getWorkspace();
  const [sessionTotals, questionTotals] = await Promise.all([
    prisma.studySession.groupBy({
      by: ["subjectId"],
      where: { examId: workspace.id },
      _sum: { durationMinutes: true },
    }),
    prisma.questionLog.groupBy({
      by: ["subjectId"],
      where: { examId: workspace.id },
      _sum: { questionsAnswered: true, correctAnswers: true },
    }),
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
  const rows = workspace.subjects
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
    .sort((a, b) => b.minutes - a.minutes);
  const totalMinutes = rows.reduce((total, row) => total + row.minutes, 0);
  const totalAnswered = rows.reduce((total, row) => total + row.answered, 0);
  const totalCorrect = rows.reduce((total, row) => total + row.correct, 0);
  const totalAccuracy = totalAnswered
    ? Math.round((totalCorrect / totalAnswered) * 100)
    : 0;
  const maxMinutes = Math.max(...rows.map((row) => row.minutes), 60);

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Análise"
        title="Relatórios"
        description="Entenda onde a dupla investiu tempo e como está o aproveitamento nas questões."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Tempo acumulado</p>
          <p className="mt-2 text-2xl font-bold">{minutesToLabel(totalMinutes)}</p>
        </article>
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Questões resolvidas</p>
          <p className="mt-2 text-2xl font-bold">{totalAnswered}</p>
        </article>
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Aproveitamento geral</p>
          <p className="mt-2 text-2xl font-bold">{totalAccuracy}%</p>
        </article>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Distribuição por matéria</h2>
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
      </section>
    </div>
  );
}
