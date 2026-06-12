import { Trash2 } from "lucide-react";

import { deleteStudySession } from "@/app/actions";
import { PageHeading } from "@/components/page-heading";
import { StudySessionForm } from "@/components/record-forms";
import { Button } from "@/components/ui/button";
import { getWorkspace } from "@/lib/data";
import { formatDate, formatDateInput, minutesToLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Sessões",
};

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const workspace = await getWorkspace();
  const sessions = await prisma.studySession.findMany({
    where: { examId: workspace.id },
    orderBy: [{ studiedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { user: true, subject: true },
  });
  const users = workspace.memberships.map((membership) => membership.user);

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
          Um registro rápido já atualiza todos os indicadores.
        </p>
        <div className="mt-5">
          <StudySessionForm
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
            {sessions.length} {sessions.length === 1 ? "registro" : "registros"}
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
                className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
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
                    {session.notes && (
                      <p className="mt-2 text-sm leading-6">{session.notes}</p>
                    )}
                  </div>
                </div>
                <form action={deleteStudySession}>
                  <input type="hidden" name="id" value={session.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir sessão"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
