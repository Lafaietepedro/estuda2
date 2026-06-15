"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  createQuestionLog,
  createStudySession,
  createSubject,
  updateQuestionLog,
  updateStudySession,
  updateSubject,
} from "@/app/actions";
import {
  FieldError,
  fieldClassName,
  FormMessage,
  SubmitButton,
  textareaClassName,
} from "@/components/form-controls";
import { initialFormState } from "@/lib/form-state";

type Option = {
  id: string;
  name: string;
};

type RecordFormProps = {
  subjects: Option[];
  defaultDate: string;
};

export function StudySessionForm({
  subjects,
  defaultDate,
}: RecordFormProps) {
  const [state, formAction] = useActionState(
    createStudySession,
    initialFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Matéria
          <select
            name="subjectId"
            disabled={subjects.length === 0}
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
          Data
          <input
            name="studiedAt"
            type="date"
            defaultValue={defaultDate}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="studiedAt" />
        </label>

        <label className="text-sm font-medium">
          Duração em minutos
          <input
            name="durationMinutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            placeholder="Ex.: 60"
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="durationMinutes" />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Anotações <span className="font-normal text-muted-foreground">(opcional)</span>
        <textarea
          name="notes"
          maxLength={500}
          placeholder="O que foi estudado?"
          className={`${textareaClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="notes" />
      </label>

      <FormMessage state={state} />
      {subjects.length === 0 && (
        <p className="text-sm text-amber-700">
          Reative ou cadastre uma matéria antes de registrar uma sessão.
        </p>
      )}
      <SubmitButton
        className="w-full sm:w-auto"
        pendingLabel="Registrando..."
        disabled={subjects.length === 0}
      >
        Registrar sessão
      </SubmitButton>
    </form>
  );
}

export function QuestionLogForm({
  subjects,
  defaultDate,
}: RecordFormProps) {
  const [state, formAction] = useActionState(
    createQuestionLog,
    initialFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Matéria
          <select
            name="subjectId"
            disabled={subjects.length === 0}
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
          Data
          <input
            name="answeredAt"
            type="date"
            defaultValue={defaultDate}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="answeredAt" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium">
            Resolvidas
            <input
              name="questionsAnswered"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="20"
              className={`${fieldClassName} mt-1.5`}
            />
            <FieldError errors={state.errors} name="questionsAnswered" />
          </label>
          <label className="text-sm font-medium">
            Acertos
            <input
              name="correctAnswers"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="16"
              className={`${fieldClassName} mt-1.5`}
            />
            <FieldError errors={state.errors} name="correctAnswers" />
          </label>
        </div>
      </div>

      <label className="block text-sm font-medium">
        Anotações <span className="font-normal text-muted-foreground">(opcional)</span>
        <textarea
          name="notes"
          maxLength={500}
          placeholder="Banca, assunto ou ponto para revisar"
          className={`${textareaClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="notes" />
      </label>

      <FormMessage state={state} />
      {subjects.length === 0 && (
        <p className="text-sm text-amber-700">
          Reative ou cadastre uma matéria antes de registrar questões.
        </p>
      )}
      <SubmitButton
        className="w-full sm:w-auto"
        pendingLabel="Registrando..."
        disabled={subjects.length === 0}
      >
        Registrar questões
      </SubmitButton>
    </form>
  );
}

export function SubjectForm() {
  const [state, formAction] = useActionState(createSubject, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 sm:grid-cols-[1fr_180px_auto_auto] sm:items-end"
    >
      <label className="text-sm font-medium">
        Nome da matéria
        <input
          name="name"
          placeholder="Ex.: Direito Penal"
          className={`${fieldClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="name" />
      </label>
      <label className="text-sm font-medium">
        Meta semanal
        <input
          name="weeklyGoalMinutes"
          type="number"
          inputMode="numeric"
          min={1}
          max={10080}
          placeholder="Minutos"
          className={`${fieldClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="weeklyGoalMinutes" />
      </label>
      <label className="text-sm font-medium">
        Cor
        <input
          name="color"
          type="color"
          defaultValue="#7C3AED"
          className="mt-1.5 h-10 w-full min-w-20 cursor-pointer rounded-lg border bg-background p-1 sm:w-20"
        />
        <FieldError errors={state.errors} name="color" />
      </label>
      <SubmitButton pendingLabel="Adicionando...">Adicionar</SubmitButton>
      <div className="sm:col-span-4">
        <FormMessage state={state} />
      </div>
    </form>
  );
}

type StudySessionEditFormProps = {
  session: {
    id: string;
    subjectId: string;
    studiedAt: string;
    durationMinutes: number;
    notes: string;
  };
  subjects: Option[];
};

export function StudySessionEditForm({
  session,
  subjects,
}: StudySessionEditFormProps) {
  const [state, formAction] = useActionState(
    updateStudySession,
    initialFormState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={session.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Matéria
          <select
            name="subjectId"
            defaultValue={session.subjectId}
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
          Data
          <input
            name="studiedAt"
            type="date"
            defaultValue={session.studiedAt}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="studiedAt" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Duração em minutos
          <input
            name="durationMinutes"
            type="number"
            min={1}
            max={1440}
            defaultValue={session.durationMinutes}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="durationMinutes" />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Anotações
        <textarea
          name="notes"
          maxLength={500}
          defaultValue={session.notes}
          className={`${textareaClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="notes" />
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Atualizando...">
        Salvar alterações
      </SubmitButton>
    </form>
  );
}

type QuestionLogEditFormProps = {
  log: {
    id: string;
    subjectId: string;
    answeredAt: string;
    questionsAnswered: number;
    correctAnswers: number;
    notes: string;
  };
  subjects: Option[];
};

export function QuestionLogEditForm({
  log,
  subjects,
}: QuestionLogEditFormProps) {
  const [state, formAction] = useActionState(
    updateQuestionLog,
    initialFormState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={log.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Matéria
          <select
            name="subjectId"
            defaultValue={log.subjectId}
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
          Data
          <input
            name="answeredAt"
            type="date"
            defaultValue={log.answeredAt}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="answeredAt" />
        </label>
        <label className="text-sm font-medium">
          Resolvidas
          <input
            name="questionsAnswered"
            type="number"
            min={1}
            defaultValue={log.questionsAnswered}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="questionsAnswered" />
        </label>
        <label className="text-sm font-medium">
          Acertos
          <input
            name="correctAnswers"
            type="number"
            min={0}
            defaultValue={log.correctAnswers}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="correctAnswers" />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Anotações
        <textarea
          name="notes"
          maxLength={500}
          defaultValue={log.notes}
          className={`${textareaClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="notes" />
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Atualizando...">
        Salvar alterações
      </SubmitButton>
    </form>
  );
}

type SubjectEditFormProps = {
  subject: {
    id: string;
    name: string;
    color: string;
    weeklyGoalMinutes: number | null;
  };
};

export function SubjectEditForm({ subject }: SubjectEditFormProps) {
  const [state, formAction] = useActionState(updateSubject, initialFormState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={subject.id} />
      <label className="block text-sm font-medium">
        Nome
        <input
          name="name"
          defaultValue={subject.name}
          className={`${fieldClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="name" />
      </label>
      <div className="grid grid-cols-[1fr_92px] gap-3">
        <label className="text-sm font-medium">
          Meta semanal em minutos
          <input
            name="weeklyGoalMinutes"
            type="number"
            min={1}
            max={10080}
            defaultValue={subject.weeklyGoalMinutes ?? ""}
            placeholder="Sem meta"
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="weeklyGoalMinutes" />
        </label>
        <label className="text-sm font-medium">
          Cor
          <input
            name="color"
            type="color"
            defaultValue={subject.color}
            className="mt-1.5 h-10 w-full cursor-pointer rounded-lg border bg-background p-1"
          />
          <FieldError errors={state.errors} name="color" />
        </label>
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Salvando...">Salvar matéria</SubmitButton>
    </form>
  );
}
