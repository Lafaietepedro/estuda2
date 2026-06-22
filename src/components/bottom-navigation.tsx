"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck2,
  Focus,
  Home,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { label: "Hoje", href: "/", icon: Home },
  { label: "Planejar", href: "/planejamento", icon: CalendarCheck2 },
  { label: "Registrar", href: "/sessoes", icon: Plus, featured: true },
  { label: "Foco", href: "/foco", icon: Focus },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[1.75rem] border bg-card/95 px-2 py-2 shadow-soft backdrop-blur md:hidden">
      <div className="grid grid-cols-5 items-center gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold text-muted-foreground transition",
                isActive && "bg-primary/10 text-primary",
                item.featured &&
                  "mx-auto -mt-6 size-14 rounded-full bg-primary text-primary-foreground shadow-paper hover:bg-primary/95",
              )}
              aria-label={item.label}
            >
              <Icon
                className={cn("size-5", item.featured && "size-6")}
                aria-hidden="true"
              />
              {!item.featured && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
