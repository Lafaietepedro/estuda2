import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  CircleCheck,
  Clock3,
  Flame,
  Plus,
  Target,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
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

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const workspace = await getWorkspace();
  const needsSetup =
    workspace.name === "Nosso concurso" ||
    workspace.memberships.some((membership) =>
      /^Pessoa [12]$/.test(membership.user.name),
    );

  if (needsSetup) {
    redirect("/configuracoes?primeiro-acesso=1");
  }

  const weekStart = startOfCurrentWeek();
  const today = parseLocalDate(formatDateInput());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const [weekSessions, weekQuestions, recentSessions, recentQuestions] =
    await Promise.all([
      prisma.studySession.findMany({
        where: { examId: workspace.id, studiedAt: { gte: sevenDaysAgo } },
        select: { durationMinutes: true, studiedAt: true },
      }),
      prisma.questionLog.findMany({
        where: { examId: workspace.id, answeredAt: { gte: weekStart } },
        select: { questionsAnswered: true, correctAnswers: true },
      }),
      prisma.studySession.findMany({
        where: { examId: workspace.id },
        orderBy: [{ studiedAt: "desc" }, { createdAt: "desc" }],
        take: 4,
        include: { user: true, subject: true },
      }),
      prisma.questionLog.findMany({
        where: { examId: workspace.id },
        orderBy: [{ answeredAt: "desc" }, { createdAt: "desc" }],
        take: 4,
        include: { user: true, subject: true },
      }),
    ]);

  const weekMinutes = weekSessions
    .filter((session) => session.studiedAt >= weekStart)
    .reduce(
    (total, session) => total + session.durationMinutes,
    0,
    );
  const questionsAnswered = weekQuestions.reduce(
    (total, log) => total + log.questionsAnswered,
    0,
  );
  const correctAnswers = weekQuestions.reduce(
    (total, log) => total + log.correctAnswers,
    0,
  );
  const accuracy = questionsAnswered
    ? Math.round((correctAnswers / questionsAnswered) * 100)
    : 0;

  const dayTotals = new Map<string, number>();
  weekSessions
    .filter((session) => session.studiedAt >= sevenDaysAgo)
    .forEach((session) => {
      const key = formatDateInput(session.studiedAt);
      dayTotals.set(key, (dayTotals.get(key) ?? 0) + session.durationMinutes);
    });
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const key = formatDateInput(date);
    return {
      key,
      label: new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
        timeZone: "America/Sao_Paulo",
      })
        .format(date)
        .replace(".", ""),
      minutes: dayTotals.get(key) ?? 0,
    };
  });
  const maxDayMinutes = Math.max(...days.map((day) => day.minutes), 60);

  const recentActivity = [
    ...recentSessions.map((session) => ({
      id: `session-${session.id}`,
      date: session.studiedAt,
      color: session.subject.color,
      title: session.subject.name,
      detail: `${session.user.name} estudou ${minutesToLabel(session.durationMinutes)}`,
    })),
    ...recentQuestions.map((log) => ({
      id: `question-${log.id}`,
      date: log.answeredAt,
      color: log.subject.color,
      title: log.subject.name,
      detail: `${log.user.name} acertou ${log.correctAnswers} de ${log.questionsAnswered}`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  const summaryCards = [
    {
      label: "Tempo estudado",
      value: minutesToLabel(weekMinutes),
      helper: "Nesta semana",
      icon: Clock3,
      accent: "bg-violet-100 text-violet-700",
    },
    {
      label: "Questões resolvidas",
      value: String(questionsAnswered),
      helper: questionsAnswered ? `${accuracy}% de acertos` : "Nesta semana",
      icon: CircleCheck,
      accent: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Matérias ativas",
      value: String(workspace.subjects.length),
      helper: "No plano atual",
      icon: BookOpen,
      accent: "bg-sky-100 text-sky-700",
    },
  ];
  const userNames = workspace.memberships.map(
    (membership) => membership.user.name,
  );

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Visão geral
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Oi, {userNames.join(" e ")}!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Cada registro deixa o caminho até {workspace.name} mais claro.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/sessoes"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Plus aria-hidden="true" />
            Sessão
          </Link>
          <Link href="/questoes" className={cn(buttonVariants())}>
            <Plus aria-hidden="true" />
            Questões
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold tracking-tight">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.helper}
                  </p>
                </div>
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${card.accent}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <article className="min-h-72 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Ritmo dos últimos 7 dias</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Minutos registrados por dia
              </p>
            </div>
            <Flame className="size-5 text-amber-500" aria-hidden="true" />
          </div>
          <div className="mt-8 flex h-40 items-end gap-2 sm:gap-4">
            {days.map((day) => {
              const height =
                day.minutes === 0
                  ? 4
                  : Math.max(12, (day.minutes / maxDayMinutes) * 100);
              return (
                <div
                  key={day.key}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  title={`${day.minutes} minutos`}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {day.minutes || ""}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-primary/70"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] font-medium capitalize text-muted-foreground">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/10">
            <Target className="size-5 text-violet-300" aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
            Meta semanal inicial
          </p>
          <h2 className="mt-2 text-xl font-semibold">5 horas em dupla</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Vocês já registraram {minutesToLabel(weekMinutes)}. Faltam{" "}
            {minutesToLabel(Math.max(0, 300 - weekMinutes))} para a primeira
            meta.
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-400"
              style={{ width: `${Math.min(100, (weekMinutes / 300) * 100)}%` }}
            />
          </div>
          <Link
            href="/sessoes"
            className="mt-7 flex items-center gap-2 text-sm font-semibold"
          >
            Registrar estudo
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </article>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="font-semibold">Atividade recente</h2>
        {recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Os primeiros registros aparecerão aqui.
          </p>
        ) : (
          <div className="mt-4 divide-y">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className="mt-1 size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: activity.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{activity.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {activity.detail}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(activity.date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
