import type { ReactNode } from "react";

type PageHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: PageHeadingProps) {
  return (
    <header className="flex flex-col gap-4 rounded-3xl border bg-card/85 p-5 shadow-paper backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}
