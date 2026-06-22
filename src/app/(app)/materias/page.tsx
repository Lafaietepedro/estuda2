import {
  Archive,
  ArrowDown,
  ArrowUp,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  deleteSubject,
  reorderSubject,
  toggleSubjectArchive,
} from "@/app/actions";
import { PageHeading } from "@/components/page-heading";
import {
  SubjectEditForm,
  SubjectForm,
} from "@/components/record-forms";
import { ConfirmSubmitButton } from "@/components/form-controls";
import { Button } from "@/components/ui/button";
import { getWorkspace } from "@/lib/data";
import { minutesToLabel, startOfCurrentWeek } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Matérias",
};

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const workspace = await getWorkspace();
  const weekStart = startOfCurrentWeek();
  const [sessionTotals, weeklySessionTotals, questionTotals, planTotals] =
    await Promise.all([
      prisma.studySession.groupBy({
        by: ["subjectId"],
        where: { examId: workspace.id },
        _sum: { durationMinutes: true },
      }),
      prisma.studySession.groupBy({
        by: ["subjectId"],
        where: { examId: workspace.id, studiedAt: { gte: weekStart } },
        _sum: { durationMinutes: true },
      }),
      prisma.questionLog.groupBy({
        by: ["subjectId"],
        where: { examId: workspace.id },
        _sum: { questionsAnswered: true, correctAnswers: true },
      }),
      prisma.studyPlanItem.groupBy({
        by: ["subjectId"],
        where: { examId: workspace.id },
        _count: true,
      }),
    ]);
  const sessionMap = new Map(
    sessionTotals.map((item) => [item.subjectId, item._sum.durationMinutes ?? 0]),
  );
  const weeklySessionMap = new Map(
    weeklySessionTotals.map((item) => [
      item.subjectId,
      item._sum.durationMinutes ?? 0,
    ]),
  );
  const questionMap = new Map(
    questionTotals.map((item) => [
      item.subjectId,
      {
        answered: item._sum.questionsAnswered ?? 0,
        correct: item._sum.correctAnswers ?? 0,
      },
    ]),
  );
  const planMap = new Map(
    planTotals.map((item) => [item.subjectId, item._count]),
  );
  const activeSubjects = workspace.subjects.filter(
    (subject) => !subject.archivedAt,
  );
  const archivedSubjects = workspace.subjects.filter(
    (subject) => subject.archivedAt,
  );

  function subjectCard(
    subject: (typeof workspace.subjects)[number],
    index: number,
    listLength: number,
  ) {
    const minutes = sessionMap.get(subject.id) ?? 0;
    const weeklyMinutes = weeklySessionMap.get(subject.id) ?? 0;
    const questions = questionMap.get(subject.id) ?? {
      answered: 0,
      correct: 0,
    };
    const planned = planMap.get(subject.id) ?? 0;
    const historyCount = questions.answered + minutes + planned;
    const accuracy = questions.answered
      ? Math.round((questions.correct / questions.answered) * 100)
      : 0;
    const goal = subject.weeklyGoalMinutes;
    const progress = goal ? Math.min(100, (weeklyMinutes / goal) * 100) : 0;

    return (
      <article
        key={subject.id}
        className="relative rounded-2xl border bg-card p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="size-4 shrink-0 rounded-full"
              style={{ backgroundColor: subject.color }}
            />
            <div className="min-w-0">
              <h2 className="truncate font-semibold">{subject.name}</h2>
              {subject.archivedAt && (
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  Arquivada
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <form action={reorderSubject}>
              <input type="hidden" name="id" value={subject.id} />
              <input type="hidden" name="direction" value="up" />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                aria-label="Mover matéria para cima"
              >
                <ArrowUp aria-hidden="true" />
              </Button>
            </form>
            <form action={reorderSubject}>
              <input type="hidden" name="id" value={subject.id} />
              <input type="hidden" name="direction" value="down" />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={index === listLength - 1}
                aria-label="Mover matéria para baixo"
              >
                <ArrowDown aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-muted-foreground">Tempo total</dt>
            <dd className="mt-1 font-semibold">{minutesToLabel(minutes)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Questões</dt>
            <dd className="mt-1 font-semibold">{questions.answered}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Acertos</dt>
            <dd className="mt-1 font-semibold">{questions.correct}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Aproveitamento</dt>
            <dd className="mt-1 font-semibold">{accuracy}%</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Planejadas</dt>
            <dd className="mt-1 font-semibold">{planned}</dd>
          </div>
        </dl>

        {goal && (
          <div className="mt-5">
            <div className="flex justify-between gap-3 text-xs text-muted-foreground">
              <span>Meta semanal</span>
              <span>
                {minutesToLabel(weeklyMinutes)} / {minutesToLabel(goal)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ backgroundColor: subject.color, width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-1 border-t pt-4">
          <details className="group flex-1">
            <summary className="flex h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-accent">
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </summary>
            <div className="mt-3 rounded-xl border bg-muted/30 p-4">
              <SubjectEditForm subject={subject} />
            </div>
          </details>
          <form action={toggleSubjectArchive}>
            <input type="hidden" name="id" value={subject.id} />
            <input
              type="hidden"
              name="archived"
              value={subject.archivedAt ? "false" : "true"}
            />
            <Button type="submit" variant="ghost" size="sm">
              {subject.archivedAt ? (
                <RotateCcw aria-hidden="true" />
              ) : (
                <Archive aria-hidden="true" />
              )}
              {subject.archivedAt ? "Reativar" : "Arquivar"}
            </Button>
          </form>
          {historyCount === 0 && (
            <form action={deleteSubject}>
              <input type="hidden" name="id" value={subject.id} />
              <ConfirmSubmitButton
                variant="ghost"
                size="icon"
                aria-label="Excluir matéria sem histórico"
                className="text-muted-foreground hover:text-destructive"
                confirmMessage={`Excluir definitivamente a matéria ${subject.name}?`}
              >
                <Trash2 aria-hidden="true" />
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Organização"
        title="Matérias"
        description="Organize o plano da dupla sem perder o histórico das disciplinas encerradas."
      />

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Adicionar matéria</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Qualquer pessoa da dupla pode adicionar, editar, ordenar e arquivar
          matérias do plano.
        </p>
        <div className="mt-5">
          <SubjectForm />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Matérias ativas</h2>
        {activeSubjects.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeSubjects.map((subject, index) =>
              subjectCard(subject, index, activeSubjects.length),
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhuma matéria ativa.
          </div>
        )}
      </section>

      {archivedSubjects.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Arquivadas</h2>
          <div className="grid gap-4 opacity-80 sm:grid-cols-2 xl:grid-cols-3">
            {archivedSubjects.map((subject, index) =>
              subjectCard(subject, index, archivedSubjects.length),
            )}
          </div>
        </section>
      )}
    </div>
  );
}
