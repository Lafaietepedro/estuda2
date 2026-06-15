import Link from "next/link";
import { Download, Filter } from "lucide-react";

import { fieldClassName } from "@/components/form-controls";
import { Button, buttonVariants } from "@/components/ui/button";
import type { DataPeriod, DataScope } from "@/lib/data-filters";
import { cn } from "@/lib/utils";

type DataFiltersProps = {
  basePath: string;
  period: DataPeriod;
  scope: DataScope;
  subjectId?: string;
  subjects: { id: string; name: string }[];
  exportTypes?: { type: "sessoes" | "questoes"; label: string }[];
};

export function DataFilters({
  basePath,
  period,
  scope,
  subjectId = "",
  subjects,
  exportTypes = [],
}: DataFiltersProps) {
  const exportParams = new URLSearchParams({
    period,
    scope,
  });
  if (subjectId) exportParams.set("subject", subjectId);

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <form
        action={basePath}
        method="get"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[180px_180px_1fr_auto]"
      >
        <label className="text-sm font-medium">
          Período
          <select
            name="period"
            defaultValue={period}
            className={`${fieldClassName} mt-1.5`}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="all">Todo o período</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Autoria
          <select
            name="scope"
            defaultValue={scope}
            className={`${fieldClassName} mt-1.5`}
          >
            <option value="team">Toda a dupla</option>
            <option value="mine">Somente meus dados</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Matéria
          <select
            name="subject"
            defaultValue={subjectId}
            className={`${fieldClassName} mt-1.5`}
          >
            <option value="">Todas as matérias</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">
            <Filter aria-hidden="true" />
            Filtrar
          </Button>
          <Link
            href={basePath}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Limpar
          </Link>
        </div>
      </form>

      {exportTypes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          {exportTypes.map((item) => (
            <Link
              key={item.type}
              href={`/exportar?tipo=${item.type}&${exportParams.toString()}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Download aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
