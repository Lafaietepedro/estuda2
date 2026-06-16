import { LockKeyhole } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Entrar",
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
      <section className="hidden flex-col justify-between rounded-[2rem] border bg-primary p-10 text-primary-foreground shadow-soft lg:flex">
        <AppLogo className="text-primary-foreground [&_p]:text-primary-foreground/65 [&_span]:text-primary-foreground" />
        <div>
          <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
            Mesa de estudos digital
          </p>
          <h1 className="max-w-xl text-5xl font-bold leading-tight">
            Dois trajetos, um objetivo compartilhado.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/75">
            Planejem revisões, registrem questões e acompanhem a constância da
            dupla em um espaço privado, calmo e direto ao ponto.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {["Foco", "Parceria", "Progresso"].map((item) => (
            <div key={item} className="rounded-2xl bg-white/10 p-4">
              <p className="font-semibold">{item}</p>
              <p className="mt-1 text-xs text-primary-foreground/60">
                Rotina com clareza
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center lg:pl-10">
        <div className="w-full max-w-md rounded-[2rem] border bg-card/95 p-6 shadow-soft backdrop-blur sm:p-8">
          <AppLogo />
          <div className="mt-8 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="size-6" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            Espaço da dupla
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Entre para continuar sua rotina de estudos.
          </p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
