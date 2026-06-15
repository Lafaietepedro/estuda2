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

export function LoginForm({ requiresLogin }: { requiresLogin: boolean }) {
  const [state, formAction] = useActionState(login, initialFormState);

  return (
    <form action={formAction} className="space-y-4">
      {requiresLogin && (
        <label className="block text-sm font-medium">
          Login
          <input
            name="login"
            type="text"
            autoComplete="username"
            autoFocus
            className={`${fieldClassName} mt-1.5`}
          />
          <FieldError errors={state.errors} name="login" />
        </label>
      )}
      <label className="block text-sm font-medium">
        Senha
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus={!requiresLogin}
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
