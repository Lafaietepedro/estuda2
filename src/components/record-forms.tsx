"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  createQuestionLog,
  createStudySession,
  createSubject,
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
  users: Option[];
  subjects: Option[];
  defaultDate: string;
};

export function StudySessionForm({
  users,
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
          Quem estudou?
          <select name="userId" className={`${fieldClassName} mt-1.5`}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <FieldError errors={state.errors} name="userId" />
        </label>

        <label className="text-sm font-medium">
          Matéria
          <select name="subjectId" className={`${fieldClassName} mt-1.5`}>
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
      <SubmitButton className="w-full sm:w-auto" pendingLabel="Registrando...">
        Registrar sessão
      </SubmitButton>
    </form>
  );
}

export function QuestionLogForm({
  users,
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
          Quem resolveu?
          <select name="userId" className={`${fieldClassName} mt-1.5`}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <FieldError errors={state.errors} name="userId" />
        </label>

        <label className="text-sm font-medium">
          Matéria
          <select name="subjectId" className={`${fieldClassName} mt-1.5`}>
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
      <SubmitButton className="w-full sm:w-auto" pendingLabel="Registrando...">
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
      className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end"
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
      <div className="sm:col-span-3">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
