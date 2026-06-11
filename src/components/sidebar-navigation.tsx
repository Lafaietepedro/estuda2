"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  Scale,
  TimerReset,
  type LucideIcon,
} from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { cn } from "@/lib/utils";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Matérias", href: "/materias", icon: BookOpen },
  { label: "Sessões", href: "/sessoes", icon: TimerReset },
  { label: "Questões", href: "/questoes", icon: CircleHelp },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Comparativo", href: "/comparativo", icon: Scale },
];

type SidebarNavigationProps = {
  onNavigate?: () => void;
};

export function SidebarNavigation({
  onNavigate,
}: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-20 items-center border-b border-sidebar-border px-6">
        <AppLogo />
      </div>

      <div className="px-4 pt-6">
        <div className="rounded-xl border border-sidebar-border bg-white/60 p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <ClipboardList className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Concurso atual
              </p>
              <p className="truncate text-sm font-semibold text-foreground">
                Tribunal Regional Federal
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6" aria-label="Navegação principal">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-[18px]",
                  isActive
                    ? "text-sidebar-primary-foreground"
                    : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                )}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/70 p-3">
          <div className="flex -space-x-2">
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-sidebar bg-violet-100 text-xs font-bold text-violet-700">
              AM
            </span>
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-sidebar bg-emerald-100 text-xs font-bold text-emerald-700">
              BC
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Ana & Bruno</p>
            <p className="truncate text-xs text-muted-foreground">
              Dupla de estudos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

