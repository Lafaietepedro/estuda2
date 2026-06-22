import Link from "next/link";
import { StudyTimerStatus } from "@prisma/client";
import {
  ArrowUpRight,
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  CircleCheck,
  Clock3,
  Flame,
  Focus,
  Pause,
  Plus,
  RotateCcw,
  Settings,
  Target,
} from "lucide-react";

import { pauseStudyTimer, resumeStudyTimer } from "@/app/actions";
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
import { secondsToHuman, timerNetSeconds } from "@/lib/study-timer";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const workspace = await getWorkspace();
  const needsSetup =
    (workspace.name === "Nosso concurso" ||
      workspace.memberships.some((membership) =>
        /^Pessoa [12]$/.test(membership.user.name),
      ));

  const weekStart = startOfCurrentWeek();
  const today = parseLocalDate(formatDateInput());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const [
    activeTimer,
    weekSessions,
    weekQuestions,
    recentSessions,
    recentQuestions,
    nextPlanItems,
    todayPlanCount,
    overduePlanCount,
  ] = await Promise.all([
    prisma.studyTimer.findFirst({
      where: {
        examId: workspace.id,
        userId: workspace.currentUser.id,
        status: {
          in: [StudyTimerStatus.RUNNING, StudyTimerStatus.PAUSED],
        },
      },
      orderBy: { startedAt: "desc" },
      include: { subject: true, topic: { include: { parent: true } } },
    }),
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
    prisma.studyPlanItem.findMany({
      where: {
        examId: workspace.id,
        userId: workspace.currentUser.id,
        completedAt: null,
      },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
      take: 4,
      include: { subject: true, topic: { include: { parent: true } } },
    }),
    prisma.studyPlanItem.count({
      where: {
        examId: workspace.id,
        userId: workspace.currentUser.id,
        completedAt: null,
        scheduledFor: today,
      },
    }),
    prisma.studyPlanItem.count({
      where: {
        examId: workspace.id,
        userId: workspace.currentUser.id,
        completedAt: null,
        scheduledFor: { lt: today },
      },
    }),
  ]);

  const weekMinutes = weekSessions
    .filter((session) => session.studiedAt >= weekStart)
    .reduce((total, session) => total + session.durationMinutes, 0);
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
      accent: "bg-primary/10 text-primary",
    },
    {
      label: "Minhas questões",
      value: String(personalAnswered),
      helper: personalAnswered
        ? `${personalAccuracy}% de acertos`
        : "Minha semana",
      icon: CircleCheck,
      accent: "bg-green-100 text-green-700",
    },
    {
      label: "Tempo da dupla",
      value: minutesToLabel(weekMinutes),
      helper: questionsAnswered
        ? `${questionsAnswered} questões · ${accuracy}%`
        : "Nesta semana",
      icon: Target,
      accent: "bg-secondary/15 text-secondary",
    },
    {
      label: "Matérias ativas",
      value: String(
        workspace.subjects.filter((subject) => !subject.archivedAt).length,
      ),
      helper: "No plano atual",
      icon: BookOpen,
      accent: "bg-accent/15 text-accent",
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
      {needsSetup && (
        <section className="rounded-[1.75rem] border border-secondary/25 bg-secondary/10 p-5 shadow-paper sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
              Primeiro ajuste
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Personalize o espaço quando quiser.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              O dashboard já está liberado. Atualize nomes, concurso, metas e
              senhas em configurações para tirar os rótulos genéricos.
            </p>
          </div>
          <Link
            href="/configuracoes?primeiro-acesso=1"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mt-4 sm:mt-0",
            )}
          >
            <Settings aria-hidden="true" />
            Abrir configurações
          </Link>
        </section>
      )}

      {activeTimer && (
        <section className="rounded-[1.75rem] border border-primary/20 bg-primary/10 p-5 shadow-paper sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Focus className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Sessão em andamento
              </p>
              <h2 className="mt-1 text-xl font-bold">
                {activeTimer.subject.name}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Tempo líquido:{" "}
                <strong>{secondsToHuman(timerNetSeconds(activeTimer))}</strong>{" "}
                ·{" "}
                {activeTimer.status === StudyTimerStatus.RUNNING
                  ? "Em foco"
                  : "Pausada"}
                {activeTimer.topic
                  ? ` · ${
                      activeTimer.topic.parent
                        ? `${activeTimer.topic.parent.name} > ${activeTimer.topic.name}`
                        : activeTimer.topic.name
                    }`
                  : ""}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
            <Link href="/foco" className={cn(buttonVariants())}>
              Continuar
              <ArrowUpRight aria-hidden="true" />
            </Link>
            {activeTimer.status === StudyTimerStatus.RUNNING ? (
              <form action={pauseStudyTimer}>
                <input type="hidden" name="id" value={activeTimer.id} />
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "secondary" }))}
                >
                  <Pause aria-hidden="true" />
                  Pausar
                </button>
              </form>
            ) : (
              <form action={resumeStudyTimer}>
                <input type="hidden" name="id" value={activeTimer.id} />
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "secondary" }))}
                >
                  <RotateCcw aria-hidden="true" />
                  Retomar
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-[2rem] border bg-card/90 shadow-soft backdrop-blur">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              Hoje no Estuda2
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Oi, {workspace.currentUser.name}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Você tem {todayPlanCount} atividade
              {todayPlanCount === 1 ? "" : "s"} para hoje
              {overduePlanCount > 0
                ? ` e ${overduePlanCount} revisão${overduePlanCount === 1 ? "" : "ões"} atrasada${overduePlanCount === 1 ? "" : "s"}`
                : ""}. Um passo pequeno já mantém a dupla em movimento.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/sessoes" className={cn(buttonVariants())}>
                <Plus aria-hidden="true" />
                Registrar estudo
              </Link>
              <Link
                href="/questoes"
                className={cn(buttonVariants({ variant: "secondary" }))}
              >
                <Plus aria-hidden="true" />
                Registrar questões
              </Link>
              <Link
                href="/planejamento"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <CalendarCheck2 aria-hidden="true" />
                Planejar
              </Link>
            </div>
          </div>
          <div className="rounded-[1.75rem] bg-primary p-5 text-primary-foreground shadow-paper">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">
              Objetivo atual
            </p>
            <h2 className="mt-3 text-2xl font-bold">{workspace.name}</h2>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/75">
              Dois trajetos, um objetivo. O painel existe para responder: o que
              fazemos agora?
            </p>
            {examCountdown && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                <CalendarDays className="size-4" aria-hidden="true" />
                {examCountdown}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="rounded-[1.5rem] border bg-card/90 p-5 shadow-paper"
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
        <article className="min-h-72 rounded-[1.75rem] border bg-card/90 p-5 shadow-paper sm:p-6">
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

        <article className="rounded-[1.75rem] bg-primary p-6 text-primary-foreground shadow-soft">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/10">
            <Target className="size-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">
            Meta semanal da dupla
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            {minutesToLabel(weeklyGoalMinutes)} em dupla
          </h2>
          <p className="mt-3 text-sm leading-6 text-primary-foreground/75">
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
              <div className="flex items-center justify-between gap-3 text-xs text-primary-foreground/75">
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

      <section className="rounded-[1.75rem] border bg-card/90 p-5 shadow-paper sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Meu próximo passo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Estudos e revisões da sua agenda
            </p>
          </div>
          <Link
            href="/planejamento"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <CalendarCheck2 aria-hidden="true" />
            Planejar
          </Link>
        </div>

        {nextPlanItems.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Sua agenda está livre. Programe o próximo estudo ou revisão.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {nextPlanItems.map((item) => {
              const isOverdue = item.scheduledFor < today;
              return (
                <article
                  key={item.id}
                  className="rounded-2xl border bg-muted/35 p-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: item.subject.color }}
                    />
                    <span className="truncate text-xs font-medium text-muted-foreground">
                      {item.subject.name}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-semibold">
                    {item.title}
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-xs text-muted-foreground",
                      isOverdue && "font-semibold text-red-600",
                    )}
                  >
                    {isOverdue ? "Atrasada · " : ""}
                    {formatDate(item.scheduledFor)} ·{" "}
                    {minutesToLabel(item.estimatedMinutes)}
                  </p>
                  {item.topic && (
                    <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                      {item.topic.parent
                        ? `${item.topic.parent.name} > ${item.topic.name}`
                        : item.topic.name}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-[1.75rem] border bg-card/90 p-5 shadow-paper sm:p-6">
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
