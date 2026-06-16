import { BookOpenCheck } from "lucide-react";

import { cn } from "@/lib/utils";

type AppLogoProps = {
  compact?: boolean;
  className?: string;
};

export function AppLogo({ compact = false, className }: AppLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-paper">
        <BookOpenCheck className="size-5" aria-hidden="true" />
      </div>
      {!compact && (
        <div className="leading-none">
          <span className="font-serif text-xl font-bold tracking-tight text-foreground">
            Estuda<span className="text-secondary">2</span>
          </span>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            juntos, mais longe
          </p>
        </div>
      )}
    </div>
  );
}
