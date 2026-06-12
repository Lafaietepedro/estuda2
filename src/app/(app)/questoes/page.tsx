import { Trash2 } from "lucide-react";

import { deleteQuestionLog } from "@/app/actions";
import { PageHeading } from "@/components/page-heading";
import { QuestionLogForm } from "@/components/record-forms";
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
  const users = workspace.memberships.map((membership) => membership.user);

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
          Informe o total resolvido e quantas vocês acertaram.
        </p>
        <div className="mt-5">
          <QuestionLogForm
            users={users}
            subjects={workspace.subjects}
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
                  className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
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
