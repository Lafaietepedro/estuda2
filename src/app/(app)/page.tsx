import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
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
    workspace.currentMembership.role === "OWNER" &&
    (workspace.name === "Nosso concurso" ||
      workspace.memberships.some((membership) =>
        /^Pessoa [12]$/.test(membership.user.name),
      ));

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
        select: { durationMinutes: true, studiedAt: true, userId: true },
      }),
      prisma.questionLog.findMany({
        where: { examId: workspace.id, answeredAt: { gte: weekStart } },
        select: {
          questionsAnswered: true,
          correctAnswers: true,
          userId: true,
        },
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
  const personalSessions = weekSessions.filter(
    (session) =>
      session.userId === workspace.currentUser.id &&
      session.studiedAt >= weekStart,
  );
  const personalQuestions = weekQuestions.filter(
    (log) => log.userId === workspace.currentUser.id,
  );
  const personalMinutes = personalSessions.reduce(
    (total, session) => total + session.durationMinutes,
    0,
  );
  const personalAnswered = personalQuestions.reduce(
    (total, log) => total + log.questionsAnswered,
    0,
  );
  const personalCorrect = personalQuestions.reduce(
    (total, log) => total + log.correctAnswers,
    0,
  );
  const personalAccuracy = personalAnswered
    ? Math.round((personalCorrect / personalAnswered) * 100)
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
      label: "Meu tempo",
      value: minutesToLabel(personalMinutes),
      helper: "Minha semana",
      icon: Clock3,
      accent: "bg-violet-100 text-violet-700",
    },
    {
      label: "Minhas questões",
      value: String(personalAnswered),
      helper: personalAnswered
        ? `${personalAccuracy}% de acertos`
        : "Minha semana",
      icon: CircleCheck,
      accent: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Tempo da dupla",
      value: minutesToLabel(weekMinutes),
      helper: questionsAnswered
        ? `${questionsAnswered} questões · ${accuracy}%`
        : "Nesta semana",
      icon: Target,
      accent: "bg-amber-100 text-amber-700",
    },
    {
      label: "Matérias ativas",
      value: String(
        workspace.subjects.filter((subject) => !subject.archivedAt).length,
      ),
      helper: "No plano atual",
      icon: BookOpen,
      accent: "bg-sky-100 text-sky-700",
    },
  ];
  const weeklyGoalMinutes = workspace.weeklyGoalMinutes;
  const personalGoalMinutes = workspace.currentMembership.weeklyGoalMinutes;
  const daysUntilExam = workspace.examDate
    ? Math.ceil(
        (workspace.examDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;
  const examCountdown =
    daysUntilExam === null
      ? null
      : daysUntilExam > 1
        ? `${daysUntilExam} dias para a prova`
        : daysUntilExam === 1
          ? "A prova é amanhã"
          : daysUntilExam === 0
            ? "A prova é hoje"
            : "Data da prova concluída";

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Visão geral
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Oi, {workspace.currentUser.name}!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Cada registro deixa o caminho até {workspace.name} mais claro.
          </p>
          {examCountdown && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
              <CalendarDays className="size-4" aria-hidden="true" />
              {examCountdown}
            </p>
          )}
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            Meta semanal da dupla
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            {minutesToLabel(weeklyGoalMinutes)} em dupla
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Vocês já registraram {minutesToLabel(weekMinutes)}. Faltam{" "}
            {minutesToLabel(Math.max(0, weeklyGoalMinutes - weekMinutes))} para
            a meta.
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-400"
              style={{
                width: `${Math.min(
                  100,
                  (weekMinutes / weeklyGoalMinutes) * 100,
                )}%`,
              }}
            />
          </div>
          {personalGoalMinutes && (
            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
                <span>Minha meta</span>
                <span>
                  {minutesToLabel(personalMinutes)} /{" "}
                  {minutesToLabel(personalGoalMinutes)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{
                    width: `${Math.min(
                      100,
                      (personalMinutes / personalGoalMinutes) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
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
