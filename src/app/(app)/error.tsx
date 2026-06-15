"use client";

import { CircleAlert, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <section className="w-full max-w-lg rounded-2xl border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <CircleAlert className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-xl font-bold">Algo não saiu como esperado</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Seus dados continuam seguros. Tente carregar esta área novamente.
        </p>
        <Button onClick={reset} className="mt-6">
          <RefreshCw aria-hidden="true" />
          Tentar novamente
        </Button>
      </section>
    </div>
  );
}
