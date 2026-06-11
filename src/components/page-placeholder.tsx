import type { LucideIcon } from "lucide-react";

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  icon: Icon,
}: PagePlaceholderProps) {
  return (
    <section>
      <div className="mb-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>

      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center shadow-sm">
        <div className="max-w-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-base font-semibold text-foreground">
            Espaço pronto para evoluir
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A estrutura desta área já está preparada. Os fluxos e dados serão
            adicionados nas próximas etapas do produto.
          </p>
        </div>
      </div>
    </section>
  );
}

