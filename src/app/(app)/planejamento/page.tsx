import {
  CalendarCheck2,
  Check,
  CircleAlert,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  deletePlanItem,
  togglePlanItemCompletion,
} from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/form-controls";
import { PageHeading } from "@/components/page-heading";
import {
  PlanItemEditForm,
  PlanItemForm,
} from "@/components/planning-forms";
import { Button } from "@/components/ui/button";
import { getWorkspace } from "@/lib/data";
import {
  formatDate,
  formatDateInput,
  minutesToLabel,
  parseLocalDate,
  startOfCurrentWeek,
} from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Planejamento",
};

export const dynamic = "force-dynamic";

export default async function PlanningPage() {
  const workspace = await getWorkspace();
  const todayKey = formatDateInput();
  const today = parseLocalDate(todayKey);
  const weekStart = startOfCurrentWeek();
  const items = await prisma.studyPlanItem.findMany({
    where: {
      examId: workspace.id,
    },
    orderBy: [{ completedAt: "asc" }, { scheduledFor: "asc" }],
    take: 250,
    include: { user: true, subject: true, topic: { include: { parent: true } } },
  });
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
  const pending = items.filter((item) => !item.completedAt);
  const overdue = pending.filter((item) => item.scheduledFor < today);
  const todayItems = pending.filter(
    (item) => formatDateInput(item.scheduledFor) === todayKey,
  );
  const upcoming = pending.filter((item) => item.scheduledFor > today);
  const completed = items
    .filter((item) => item.completedAt)
    .sort(
      (first, second) =>
        (second.completedAt?.getTime() ?? 0) -
        (first.completedAt?.getTime() ?? 0),
    )
    .slice(0, 20);
  const completedThisWeek = items.filter(
    (item) => item.completedAt && item.completedAt >= weekStart,
  ).length;
  const pendingMinutes = pending.reduce(
    (total, item) => total + item.estimatedMinutes,
    0,
  );

  function itemCard(item: (typeof items)[number], completedStyle = false) {
    const editableSubjects = workspace.subjects.filter(
      (subject) => !subject.archivedAt || subject.id === item.subjectId,
    );

    return (
      <article
        key={item.id}
        className={cn(
          "relative rounded-2xl border bg-card p-4 shadow-sm",
          completedStyle && "bg-muted/30 opacity-80",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-1 size-3 shrink-0 rounded-full"
            style={{ backgroundColor: item.subject.color }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  item.kind === "REVIEW"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-violet-100 text-violet-700",
                )}
              >
                {item.kind === "REVIEW" ? "Revisão" : "Estudo"}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.subject.name}
              </span>
            </div>
            <h3
              className={cn(
                "mt-2 font-semibold",
                completedStyle && "line-through",
              )}
            >
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(item.scheduledFor)} ·{" "}
              {minutesToLabel(item.estimatedMinutes)} · por {item.user.name}
            </p>
            {item.topic && (
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Tópico:{" "}
                {item.topic.parent
                  ? `${item.topic.parent.name} > ${item.topic.name}`
                  : item.topic.name}
              </p>
            )}
            {item.notes && (
              <p className="mt-3 text-sm leading-6">{item.notes}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-1 border-t pt-3">
          <form action={togglePlanItemCompletion}>
            <input type="hidden" name="id" value={item.id} />
            <input
              type="hidden"
              name="completed"
              value={item.completedAt ? "false" : "true"}
            />
            <Button type="submit" variant="ghost" size="sm">
              {item.completedAt ? (
                <RotateCcw aria-hidden="true" />
              ) : (
                <Check aria-hidden="true" />
              )}
              {item.completedAt ? "Reabrir" : "Concluir"}
            </Button>
          </form>
          <details className="group">
            <summary className="flex h-8 cursor-pointer list-none items-center gap-2 rounded-md px-3 text-xs font-medium hover:bg-accent">
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </summary>
            <div className="mt-3 rounded-xl border bg-muted/30 p-4 sm:absolute sm:right-12 sm:z-20 sm:w-[34rem] sm:bg-card sm:shadow-xl">
              <PlanItemEditForm
                item={{
                  id: item.id,
                  kind: item.kind,
                  subjectId: item.subjectId,
                  topicId: item.topicId ?? "",
                  scheduledFor: formatDateInput(item.scheduledFor),
                  title: item.title,
                  estimatedMinutes: item.estimatedMinutes,
                  notes: item.notes ?? "",
                }}
                subjects={editableSubjects}
                topics={topics
                  .filter(
                    (topic) => !topic.archivedAt || topic.id === item.topicId,
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
          <form action={deletePlanItem}>
            <input type="hidden" name="id" value={item.id} />
            <ConfirmSubmitButton
              variant="ghost"
              size="icon"
              aria-label="Excluir atividade planejada"
              className="text-muted-foreground hover:text-destructive"
              confirmMessage="Excluir esta atividade do planejamento?"
            >
              <Trash2 aria-hidden="true" />
            </ConfirmSubmitButton>
          </form>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Organização"
        title="Planejamento"
        description="Organize os próximos estudos e revisões da dupla, com cada atividade identificada por pessoa."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Para hoje</p>
          <p className="mt-2 text-2xl font-bold">{todayItems.length}</p>
        </article>
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Tempo pendente</p>
          <p className="mt-2 text-2xl font-bold">
            {minutesToLabel(pendingMinutes)}
          </p>
        </article>
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Concluídas nesta semana
          </p>
          <p className="mt-2 text-2xl font-bold">{completedThisWeek}</p>
        </article>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <CalendarCheck2 className="size-5 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold">Programar atividade</h2>
            <p className="text-sm text-muted-foreground">
              A atividade será adicionada à agenda de{" "}
              {workspace.currentUser.name}.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <PlanItemForm
            subjects={activeSubjects}
            topics={activeTopics}
            defaultDate={todayKey}
          />
        </div>
      </section>

      {overdue.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2 text-red-700">
            <CircleAlert className="size-5" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Atrasadas</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {overdue.map((item) => itemCard(item))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Hoje</h2>
        {todayItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhuma atividade planejada para hoje.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {todayItems.map((item) => itemCard(item))}
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Próximas atividades</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {upcoming.map((item) => itemCard(item))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Concluídas recentemente</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {completed.map((item) => itemCard(item, true))}
          </div>
        </section>
      )}
    </div>
  );
}
