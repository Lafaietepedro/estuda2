"use client";

import { useActionState } from "react";

import { login } from "@/app/actions";
import {
  FieldError,
  fieldClassName,
  FormMessage,
  SubmitButton,
} from "@/components/form-controls";
import { initialFormState } from "@/lib/form-state";

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialFormState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        Senha da dupla
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          className={`${fieldClassName} mt-1.5`}
        />
        <FieldError errors={state.errors} name="password" />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingLabel="Entrando...">
        Entrar
      </SubmitButton>
    </form>
  );
}
