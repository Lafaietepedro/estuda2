"use client";

import { useActionState } from "react";

import { updateSettings } from "@/app/actions";
import {
  FieldError,
  fieldClassName,
  FormMessage,
  SubmitButton,
  textareaClassName,
} from "@/components/form-controls";
import { initialFormState } from "@/lib/form-state";

type SettingsFormProps = {
  exam: {
    name: string;
    description: string;
    examDate: string;
    weeklyGoalMinutes: number;
  };
  users: [
    { id: string; name: string; login: string; weeklyGoalMinutes: number | null },
    { id: string; name: string; login: string; weeklyGoalMinutes: number | null },
  ];
};

export function SettingsForm({ exam, users }: SettingsFormProps) {
  const [state, formAction] = useActionState(updateSettings, initialFormState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="firstUserId" value={users[0].id} />
      <input type="hidden" name="secondUserId" value={users[1].id} />

      <div className="grid gap-4 sm:grid-cols-2">
        {users.map((user, index) => {
          const prefix = index === 0 ? "firstUser" : "secondUser";
          return (
            <fieldset key={user.id} className="space-y-4 rounded-xl border p-4">
              <legend className="px-2 text-sm font-semibold">
                {index === 0 ? "Responsável" : "Segundo integrante"}
              </legend>
              <label className="block text-sm font-medium">
                Nome
                <input
                  name={`${prefix}Name`}
                  defaultValue={user.name}
                  className={`${fieldClassName} mt-1.5`}
                />
                <FieldError errors={state.errors} name={`${prefix}Name`} />
              </label>
              <label className="block text-sm font-medium">
                Login
                <input
                  name={`${prefix}Login`}
                  defaultValue={user.login}
                  autoComplete="username"
                  className={`${fieldClassName} mt-1.5`}
                />
                <FieldError errors={state.errors} name={`${prefix}Login`} />
              </label>
              <label className="block text-sm font-medium">
                Nova senha{" "}
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
                <input
                  name={`${prefix}Password`}
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  className={`${fieldClassName} mt-1.5`}
                />
              </label>
              <label className="block text-sm font-medium">
                Meta semanal individual
                <input
                  name={`${prefix}WeeklyGoalMinutes`}
                  type="number"
                  min={1}
                  max={10080}
                  defaultValue={user.weeklyGoalMinutes ?? ""}
                  placeholder="Minutos por semana"
                  className={`${fieldClassName} mt-1.5`}
                />
                <FieldError
                  errors={state.errors}
                  name={`${prefix}WeeklyGoalMinutes`}
                />
              </label>
            </fieldset>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_220px_220px]">
        <label className="text-sm font-medium">
          Concurso ou objetivo
          <input
            name="examName"
            defaultValue={exam.name}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="examName" />
        </label>
        <label className="text-sm font-medium">
          Data da prova
          <input
            name="examDate"
            type="date"
            defaultValue={exam.examDate}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="examDate" />
        </label>
        <label className="text-sm font-medium">
          Meta semanal da dupla
          <input
            name="weeklyGoalMinutes"
            type="number"
            min={1}
            max={10080}
            defaultValue={exam.weeklyGoalMinutes}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="weeklyGoalMinutes" />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Descrição <span className="font-normal text-muted-foreground">(opcional)</span>
        <textarea
          name="description"
          defaultValue={exam.description}
          maxLength={240}
          className={`${textareaClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="description" />
      </label>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Salvando...">Salvar configurações</SubmitButton>
    </form>
  );
}
