import { Pencil, Trash2 } from "lucide-react";

import { deleteQuestionLog } from "@/app/actions";
import { PageHeading } from "@/components/page-heading";
import {
  QuestionLogEditForm,
  QuestionLogForm,
} from "@/components/record-forms";
import { Button } from "@/components/ui/button";
import { getWorkspace } from "@/lib/data";
import { formatDate, formatDateInput } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Questões",
};

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const workspace = await getWorkspace();
  const logs = await prisma.questionLog.findMany({
    where: { examId: workspace.id },
    orderBy: [{ answeredAt: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { user: true, subject: true },
  });
  const activeSubjects = workspace.subjects.filter(
    (subject) => !subject.archivedAt,
  );

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Desempenho"
        title="Questões"
        description="Registre questões resolvidas e acertos para acompanhar a evolução por matéria."
      />

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Novo registro</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O registro será vinculado automaticamente a{" "}
          <strong>{workspace.currentUser.name}</strong>.
        </p>
        <div className="mt-5">
          <QuestionLogForm
            subjects={activeSubjects}
            defaultDate={formatDateInput()}
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Histórico</h2>
          <span className="text-sm text-muted-foreground">
            {logs.length} {logs.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card px-5 py-12 text-center text-sm text-muted-foreground">
            Nenhuma questão registrada ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const accuracy = Math.round(
                (log.correctAnswers / log.questionsAnswered) * 100,
              );

              return (
                <article
                  key={log.id}
                  className="relative flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: log.subject.color }}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-semibold">{log.subject.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          por {log.user.name}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(log.answeredAt)} · {log.correctAnswers} de{" "}
                        {log.questionsAnswered} acertos
                      </p>
                      {log.notes && (
                        <p className="mt-2 text-sm leading-6">{log.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {accuracy}%
                    </span>
                    {log.userId === workspace.currentUser.id && (
                      <>
                        <details className="group">
                          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                            <Pencil className="size-4" aria-hidden="true" />
                            <span className="sr-only">Editar registro</span>
                          </summary>
                          <div className="mt-3 rounded-xl border bg-muted/30 p-4 sm:absolute sm:right-10 sm:z-20 sm:w-[32rem] sm:bg-card sm:shadow-xl">
                            <QuestionLogEditForm
                              log={{
                                id: log.id,
                                subjectId: log.subjectId,
                                answeredAt: formatDateInput(log.answeredAt),
                                questionsAnswered: log.questionsAnswered,
                                correctAnswers: log.correctAnswers,
                                notes: log.notes ?? "",
                              }}
                              subjects={workspace.subjects.filter(
                                (subject) =>
                                  !subject.archivedAt ||
                                  subject.id === log.subjectId,
                              )}
                            />
                          </div>
                        </details>
                        <form action={deleteQuestionLog}>
                          <input type="hidden" name="id" value={log.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            aria-label="Excluir registro"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </form>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
