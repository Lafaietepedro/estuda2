"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarCheck2,
  CircleHelp,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Scale,
  Settings,
  TimerReset,
  type LucideIcon,
} from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { logout } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Matérias", href: "/materias", icon: BookOpen },
  { label: "Edital", href: "/edital", icon: FileText },
  { label: "Planejamento", href: "/planejamento", icon: CalendarCheck2 },
  { label: "Sessões", href: "/sessoes", icon: TimerReset },
  { label: "Questões", href: "/questoes", icon: CircleHelp },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Comparativo", href: "/comparativo", icon: Scale },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

type SidebarNavigationProps = {
  examName: string;
  currentUser: { name: string; role: "OWNER" | "MEMBER" };
  users: { id: string; name: string }[];
  onNavigate?: () => void;
};

export function SidebarNavigation({
  examName,
  currentUser,
  users,
  onNavigate,
}: SidebarNavigationProps) {
  const pathname = usePathname();
  const firstUser = users[0]?.name ?? "Pessoa 1";
  const secondUser = users[1]?.name ?? "Pessoa 2";
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

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
                {examName}
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
          <span className="flex size-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
            {initials(currentUser.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {currentUser.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {currentUser.role === "OWNER" ? "Responsável" : "Integrante"} ·{" "}
              {firstUser} & {secondUser}
            </p>
          </div>
        </div>
        <form action={logout} className="mt-2">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
          >
            <LogOut aria-hidden="true" />
            Sair
          </Button>
        </form>
      </div>
    </div>
  );
}
