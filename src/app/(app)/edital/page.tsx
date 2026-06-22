import {
  Archive,
  ArrowDown,
  ArrowUp,
  FileText,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  deleteTopic,
  reorderTopic,
  toggleTopicArchive,
} from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/form-controls";
import { PageHeading } from "@/components/page-heading";
import { TopicEditForm, TopicForm } from "@/components/topic-forms";
import { Button } from "@/components/ui/button";
import { getWorkspace } from "@/lib/data";
import { minutesToLabel } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Edital",
};

export const dynamic = "force-dynamic";

export default async function SyllabusPage() {
  const workspace = await getWorkspace();
  const [topics, sessionTotals, questionTotals, planTotals] =
    await Promise.all([
      prisma.topic.findMany({
        where: { examId: workspace.id },
        orderBy: [
          { subject: { position: "asc" } },
          { parentId: "asc" },
          { position: "asc" },
          { name: "asc" },
        ],
        include: {
          subject: true,
          parent: true,
          _count: {
            select: {
              children: true,
              studySessions: true,
              questionLogs: true,
              studyPlanItems: true,
            },
          },
        },
      }),
      prisma.studySession.groupBy({
        by: ["topicId"],
        where: { examId: workspace.id, topicId: { not: null } },
        _sum: { durationMinutes: true },
      }),
      prisma.questionLog.groupBy({
        by: ["topicId"],
        where: { examId: workspace.id, topicId: { not: null } },
        _sum: { questionsAnswered: true, correctAnswers: true },
      }),
      prisma.studyPlanItem.groupBy({
        by: ["topicId"],
        where: { examId: workspace.id, topicId: { not: null } },
        _count: true,
      }),
    ]);
  const activeSubjects = workspace.subjects.filter(
    (subject) => !subject.archivedAt,
  );
  const activeTopics = topics.filter(
    (topic) => !topic.archivedAt && !topic.parent?.archivedAt,
  );
  const archivedTopics = topics.filter(
    (topic) => topic.archivedAt || topic.parent?.archivedAt,
  );
  const parentTopics = activeTopics
    .filter((topic) => !topic.parentId)
    .map((topic) => ({
      id: topic.id,
      name: topic.name,
      subjectId: topic.subjectId,
      subjectName: topic.subject.name,
      parentName: null,
    }));
  const sessionMap = new Map(
    sessionTotals.map((item) => [
      item.topicId,
      item._sum.durationMinutes ?? 0,
    ]),
  );
  const questionMap = new Map(
    questionTotals.map((item) => [
      item.topicId,
      {
        answered: item._sum.questionsAnswered ?? 0,
        correct: item._sum.correctAnswers ?? 0,
      },
    ]),
  );
  const planMap = new Map(
    planTotals.map((item) => [item.topicId, item._count]),
  );
  const childrenByParent = new Map<string, typeof topics>();
  for (const topic of activeTopics) {
    if (!topic.parentId) continue;
    childrenByParent.set(topic.parentId, [
      ...(childrenByParent.get(topic.parentId) ?? []),
      topic,
    ]);
  }

  function topicCard(
    topic: (typeof topics)[number],
    index: number,
    listLength: number,
    isChild = false,
  ) {
    const minutes = sessionMap.get(topic.id) ?? 0;
    const questions = questionMap.get(topic.id) ?? {
      answered: 0,
      correct: 0,
    };
    const planned = planMap.get(topic.id) ?? 0;
    const accuracy = questions.answered
      ? Math.round((questions.correct / questions.answered) * 100)
      : 0;
    const historyCount =
      topic._count.children +
      topic._count.studySessions +
      topic._count.questionLogs +
      topic._count.studyPlanItems;

    return (
      <article
        key={topic.id}
        className={cn(
          "rounded-2xl border bg-card p-4 shadow-sm",
          isChild && "ml-4 border-dashed sm:ml-8",
          topic.archivedAt && "bg-muted/30 opacity-80",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: topic.subject.color }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {topic.subject.name}
              </span>
              {topic.parent && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {topic.parent.name}
                </span>
              )}
              {topic.archivedAt && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Arquivado
                </span>
              )}
            </div>
            <h3 className="mt-2 font-semibold">{topic.name}</h3>
            {topic.description && (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {topic.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center">
            <form action={reorderTopic}>
              <input type="hidden" name="id" value={topic.id} />
              <input type="hidden" name="direction" value="up" />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                aria-label="Mover tópico para cima"
              >
                <ArrowUp aria-hidden="true" />
              </Button>
            </form>
            <form action={reorderTopic}>
              <input type="hidden" name="id" value={topic.id} />
              <input type="hidden" name="direction" value="down" />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={index === listLength - 1}
                aria-label="Mover tópico para baixo"
              >
                <ArrowDown aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Tempo</dt>
            <dd className="mt-1 font-semibold">{minutesToLabel(minutes)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Questões</dt>
            <dd className="mt-1 font-semibold">{questions.answered}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Acertos</dt>
            <dd className="mt-1 font-semibold">{accuracy}%</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Planejadas</dt>
            <dd className="mt-1 font-semibold">{planned}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-1 border-t pt-4">
          <details className="group flex-1">
            <summary className="flex h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-accent">
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </summary>
            <div className="mt-3 rounded-xl border bg-muted/30 p-4">
              <TopicEditForm
                topic={{
                  id: topic.id,
                  name: topic.name,
                  description: topic.description ?? "",
                }}
              />
            </div>
          </details>
          <form action={toggleTopicArchive}>
            <input type="hidden" name="id" value={topic.id} />
            <input
              type="hidden"
              name="archived"
              value={topic.archivedAt ? "false" : "true"}
            />
            <Button type="submit" variant="ghost" size="sm">
              {topic.archivedAt ? (
                <RotateCcw aria-hidden="true" />
              ) : (
                <Archive aria-hidden="true" />
              )}
              {topic.archivedAt ? "Reativar" : "Arquivar"}
            </Button>
          </form>
          {historyCount === 0 && (
            <form action={deleteTopic}>
              <input type="hidden" name="id" value={topic.id} />
              <ConfirmSubmitButton
                variant="ghost"
                size="icon"
                aria-label="Excluir tópico sem histórico"
                className="text-muted-foreground hover:text-destructive"
                confirmMessage={`Excluir definitivamente o tópico ${topic.name}?`}
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
        eyebrow="Conteúdo"
        title="Edital"
        description="Organize tópicos e subtópicos por matéria para registrar exatamente o que foi estudado."
      />

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <FileText className="size-5 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold">Adicionar tópico</h2>
            <p className="text-sm text-muted-foreground">
              Use tópicos principais e subtópicos para representar o edital.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <TopicForm subjects={activeSubjects} parentTopics={parentTopics} />
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Tópicos ativos</h2>
        {activeTopics.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhum tópico cadastrado ainda.
          </div>
        ) : (
          activeSubjects.map((subject) => {
            const parentList = activeTopics.filter(
              (topic) => topic.subjectId === subject.id && !topic.parentId,
            );
            if (parentList.length === 0) return null;

            return (
              <div key={subject.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <h3 className="font-semibold">{subject.name}</h3>
                </div>
                {parentList.map((topic, index) => {
                  const children = childrenByParent.get(topic.id) ?? [];
                  return (
                    <div key={topic.id} className="space-y-3">
                      {topicCard(topic, index, parentList.length)}
                      {children.map((child, childIndex) =>
                        topicCard(child, childIndex, children.length, true),
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </section>

      {archivedTopics.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Arquivados</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {archivedTopics.map((topic, index) =>
              topicCard(topic, index, archivedTopics.length),
            )}
          </div>
        </section>
      )}
    </div>
  );
}
