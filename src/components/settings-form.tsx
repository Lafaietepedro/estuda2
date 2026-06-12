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
  };
  users: [
    { id: string; name: string },
    { id: string; name: string },
  ];
};

export function SettingsForm({ exam, users }: SettingsFormProps) {
  const [state, formAction] = useActionState(updateSettings, initialFormState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="firstUserId" value={users[0].id} />
      <input type="hidden" name="secondUserId" value={users[1].id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Primeiro integrante
          <input
            name="firstUserName"
            defaultValue={users[0].name}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="firstUserName" />
        </label>
        <label className="text-sm font-medium">
          Segundo integrante
          <input
            name="secondUserName"
            defaultValue={users[1].name}
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="secondUserName" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
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
