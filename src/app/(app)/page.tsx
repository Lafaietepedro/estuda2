import {
  ArrowUpRight,
  BookOpen,
  CircleCheck,
  Clock3,
  Flame,
  Target,
} from "lucide-react";

const summaryCards = [
  {
    label: "Tempo estudado",
    value: "0h 00min",
    helper: "Nesta semana",
    icon: Clock3,
    accent: "bg-violet-100 text-violet-700",
  },
  {
    label: "Questões resolvidas",
    value: "0",
    helper: "Nesta semana",
    icon: CircleCheck,
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Matérias ativas",
    value: "6",
    helper: "No plano atual",
    icon: BookOpen,
    accent: "bg-sky-100 text-sky-700",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Visão geral
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Olá, dupla!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            A preparação começa aqui. Registrem o primeiro passo de hoje.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <Flame className="size-4 text-amber-500" aria-hidden="true" />
          Sequência começa no primeiro estudo
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold tracking-tight">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.helper}
                  </p>
                </div>
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${card.accent}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <article className="min-h-72 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Ritmo da semana</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Horas registradas por dia
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Últimos 7 dias
            </span>
          </div>
          <div className="mt-8 flex h-40 items-end gap-3 sm:gap-5">
            {[18, 34, 24, 48, 28, 20, 12].map((height, index) => (
              <div
                key={index}
                className="flex flex-1 flex-col items-center justify-end gap-2"
              >
                <div
                  className="w-full rounded-t-md bg-primary/15"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] font-medium uppercase text-muted-foreground">
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][index]}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/10">
            <Target className="size-5 text-violet-300" aria-hidden="true" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
            Próximo objetivo
          </p>
          <h2 className="mt-2 text-xl font-semibold">Começar o ciclo de estudos</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Escolham uma matéria e registrem a primeira sessão para liberar os
            indicadores da dupla.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-white">
            Meta inicial: 5 horas
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </div>
        </article>
      </section>
    </div>
  );
}

