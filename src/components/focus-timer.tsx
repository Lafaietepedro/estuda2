"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  Square,
  TimerReset,
} from "lucide-react";

import {
  cancelStudyTimer,
  finishStudyTimer,
  pauseStudyTimer,
  resumeStudyTimer,
  startStudyTimer,
} from "@/app/actions";
import {
  ConfirmSubmitButton,
  FieldError,
  fieldClassName,
  FormMessage,
  SubmitButton,
  textareaClassName,
} from "@/components/form-controls";
import { Button } from "@/components/ui/button";
import { initialFormState } from "@/lib/form-state";
import {
  secondsToClock,
  secondsToHuman,
  timerNetSeconds,
  timerPauseSeconds,
} from "@/lib/study-timer";
import { topicOptionLabel, type TopicOption } from "@/lib/topics";

type SubjectOption = {
  id: string;
  name: string;
};

type StartFocusFormProps = {
  subjects: SubjectOption[];
  topics: TopicOption[];
  reviewSummary: string;
  reviewMinutes: number;
};

export function StartFocusForm({
  subjects,
  topics,
  reviewSummary,
  reviewMinutes,
}: StartFocusFormProps) {
  const [state, formAction] = useActionState(
    startStudyTimer,
    initialFormState,
  );
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const availableTopics = useMemo(
    () => topics.filter((topic) => topic.subjectId === subjectId),
    [subjectId, topics],
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Matéria
          <select
            name="subjectId"
            value={subjectId}
            disabled={subjects.length === 0}
            onChange={(event) => setSubjectId(event.target.value)}
            className={`${fieldClassName} mt-1.5`}
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <FieldError errors={state.errors} name="subjectId" />
        </label>

        <label className="text-sm font-medium">
          Tópico do edital{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
          <select
            key={subjectId}
            name="topicId"
            disabled={subjects.length === 0}
            className={`${fieldClassName} mt-1.5`}
          >
            <option value="">Sem tópico específico</option>
            {availableTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topicOptionLabel(topic)}
              </option>
            ))}
          </select>
          <FieldError errors={state.errors} name="topicId" />
        </label>
      </div>

      <div className="rounded-2xl border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <TimerReset className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold">Modo livre</h2>
            <p className="text-sm text-muted-foreground">
              Inicie, pause quando precisar e salve ao terminar. Pausas não
              entram no tempo líquido.
            </p>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4 text-sm">
        <input
          name="autoReviews"
          type="checkbox"
          defaultChecked
          className="mt-1 size-4 rounded border-input"
        />
        <span>
          <span className="font-medium">Criar revisões automáticas ao salvar</span>
          <span className="mt-1 block text-muted-foreground">
            Programa revisões em {reviewSummary}, com {reviewMinutes} minutos
            cada, quando a sessão for finalizada.
          </span>
        </span>
      </label>

      <FormMessage state={state} />
      {subjects.length === 0 && (
        <p className="text-sm text-amber-700">
          Reative ou cadastre uma matéria antes de iniciar o Modo Foco.
        </p>
      )}
      <SubmitButton
        disabled={subjects.length === 0}
        pendingLabel="Iniciando..."
        className="w-full sm:w-auto"
      >
        <Play aria-hidden="true" />
        Iniciar sessão
      </SubmitButton>
    </form>
  );
}

type FocusTimerView = {
  id: string;
  status: "RUNNING" | "PAUSED";
  startedAt: string;
  lastResumedAt: string;
  pausedAt: string | null;
  accumulatedSeconds: number;
  pauseSeconds: number;
  createReviews: boolean;
  subject: {
    name: string;
    color: string;
  };
  topic: {
    name: string;
    parentName: string | null;
  } | null;
};

type ActiveFocusTimerProps = {
  timer: FocusTimerView;
  reviewSummary: string;
  reviewMinutes: number;
};

export function ActiveFocusTimer({
  timer,
  reviewSummary,
  reviewMinutes,
}: ActiveFocusTimerProps) {
  const [now, setNow] = useState(() => new Date());
  const [showSummary, setShowSummary] = useState(false);
  const [finishState, finishAction] = useActionState(
    finishStudyTimer,
    initialFormState,
  );
  const netSeconds = timerNetSeconds(timer, now);
  const pauseSeconds = timerPauseSeconds(timer, now);
  const isPaused = timer.status === "PAUSED";
  const topicLabel = timer.topic
    ? timer.topic.parentName
      ? `${timer.topic.parentName} > ${timer.topic.name}`
      : timer.topic.name
    : "Sem tópico específico";

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border bg-card shadow-soft">
        <div
          className="h-2"
          style={{ backgroundColor: timer.subject.color }}
        />
        <div className="p-5 text-center sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            {isPaused ? "Sessão pausada" : "Foco em andamento"}
          </p>
          <h2 className="mt-3 text-2xl font-bold">{timer.subject.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{topicLabel}</p>

          <div className="mx-auto mt-8 flex size-56 flex-col items-center justify-center rounded-full border bg-muted/30 shadow-inner sm:size-64">
            <p className="font-mono text-5xl font-bold tracking-tight sm:text-6xl">
              {secondsToClock(netSeconds)}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              tempo líquido
            </p>
          </div>

          <div className="mt-7 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border bg-background/70 p-4">
              <p className="text-muted-foreground">Status</p>
              <p className="mt-1 font-semibold">
                {isPaused ? "Pausada" : "Em foco"}
              </p>
            </div>
            <div className="rounded-2xl border bg-background/70 p-4">
              <p className="text-muted-foreground">Pausas</p>
              <p className="mt-1 font-semibold">
                {secondsToHuman(pauseSeconds)}
              </p>
            </div>
            <div className="rounded-2xl border bg-background/70 p-4">
              <p className="text-muted-foreground">Modo</p>
              <p className="mt-1 font-semibold">Livre</p>
            </div>
          </div>

          {!showSummary && (
            <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
              {isPaused ? (
                <form action={resumeStudyTimer}>
                  <input type="hidden" name="id" value={timer.id} />
                  <SubmitButton className="w-full sm:w-auto" pendingLabel="Retomando...">
                    <RotateCcw aria-hidden="true" />
                    Retomar
                  </SubmitButton>
                </form>
              ) : (
                <form action={pauseStudyTimer}>
                  <input type="hidden" name="id" value={timer.id} />
                  <SubmitButton
                    variant="secondary"
                    className="w-full sm:w-auto"
                    pendingLabel="Pausando..."
                  >
                    <Pause aria-hidden="true" />
                    Pausar
                  </SubmitButton>
                </form>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowSummary(true)}
              >
                <Square aria-hidden="true" />
                Encerrar
              </Button>
            </div>
          )}
        </div>
      </section>

      {showSummary && (
        <section className="rounded-[1.75rem] border bg-card p-5 shadow-paper sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                Resumo da sessão
              </p>
              <h2 className="mt-1 text-xl font-semibold">Revise antes de salvar</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Encerrar não salva automaticamente. Confirme os detalhes ou
                descarte a sessão.
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-muted/40 p-4">
              <dt className="text-xs text-muted-foreground">Tempo líquido</dt>
              <dd className="mt-1 font-semibold">{secondsToHuman(netSeconds)}</dd>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <dt className="text-xs text-muted-foreground">Pausas</dt>
              <dd className="mt-1 font-semibold">
                {secondsToHuman(pauseSeconds)}
              </dd>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <dt className="text-xs text-muted-foreground">Matéria</dt>
              <dd className="mt-1 font-semibold">{timer.subject.name}</dd>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <dt className="text-xs text-muted-foreground">Modo</dt>
              <dd className="mt-1 font-semibold">Livre</dd>
            </div>
          </dl>

          <form action={finishAction} className="mt-5 space-y-4">
            <input type="hidden" name="id" value={timer.id} />
            <label className="block text-sm font-medium">
              Notas{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
              <textarea
                name="notes"
                maxLength={500}
                placeholder="O que rendeu nesta sessão?"
                className={`${textareaClassName} mt-1.5`}
              />
              <FieldError errors={finishState.errors} name="notes" />
            </label>

            <label className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4 text-sm">
              <input
                name="autoReviews"
                type="checkbox"
                defaultChecked={timer.createReviews}
                className="mt-1 size-4 rounded border-input"
              />
              <span>
                <span className="font-medium">Criar revisões automáticas</span>
                <span className="mt-1 block text-muted-foreground">
                  Programa revisões em {reviewSummary}, com {reviewMinutes}{" "}
                  minutos cada.
                </span>
              </span>
            </label>

            <FormMessage state={finishState} />

            <div className="flex flex-col gap-2 sm:flex-row">
              <SubmitButton
                className="w-full sm:w-auto"
                pendingLabel="Salvando..."
              >
                <CheckCircle2 aria-hidden="true" />
                Salvar sessão
              </SubmitButton>
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => setShowSummary(false)}
              >
                Voltar ao timer
              </Button>
            </div>
          </form>

          <form action={cancelStudyTimer} className="mt-3">
            <input type="hidden" name="id" value={timer.id} />
            <ConfirmSubmitButton
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive sm:w-auto"
              confirmMessage="Descartar esta sessão em andamento? Nada será salvo no histórico."
            >
              <Ban aria-hidden="true" />
              Descartar sessão
            </ConfirmSubmitButton>
          </form>
        </section>
      )}
    </div>
  );
}
