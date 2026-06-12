"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import type { FormState } from "@/lib/form-state";
import { cn } from "@/lib/utils";

export const fieldClassName =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";

export const textareaClassName =
  "min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

export function FieldError({
  errors,
  name,
}: {
  errors?: FormState["errors"];
  name: string;
}) {
  const message = errors?.[name]?.[0];
  if (!message) return null;

  return <p className="mt-1 text-xs font-medium text-destructive">{message}</p>;
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        state.status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800",
      )}
      role="status"
    >
      {state.message}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Salvando...",
  ...props
}: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
