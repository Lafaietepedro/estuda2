import { PageHeading } from "@/components/page-heading";
import { SubjectForm } from "@/components/record-forms";
import { getWorkspace } from "@/lib/data";
import { minutesToLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Matérias",
};

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
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
  const sessionMap = new Map(
    sessionTotals.map((item) => [item.subjectId, item._sum.durationMinutes ?? 0]),
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

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Organização"
        title="Matérias"
        description="Acompanhe como o esforço da dupla está distribuído e adicione disciplinas ao plano."
      />

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Adicionar matéria</h2>
        <div className="mt-5">
          <SubjectForm />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {workspace.subjects.map((subject) => {
          const minutes = sessionMap.get(subject.id) ?? 0;
          const questions = questionMap.get(subject.id) ?? {
            answered: 0,
            correct: 0,
          };
          const accuracy = questions.answered
            ? Math.round((questions.correct / questions.answered) * 100)
            : 0;

          return (
            <article
              key={subject.id}
              className="rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className="size-4 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <h2 className="font-semibold">{subject.name}</h2>
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
              </dl>
            </article>
          );
        })}
      </section>
    </div>
  );
}
