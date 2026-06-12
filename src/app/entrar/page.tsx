import { LockKeyhole } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        <AppLogo />
        <div className="mt-8 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LockKeyhole className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          Espaço da dupla
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use a senha compartilhada para acessar os registros de estudo.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
