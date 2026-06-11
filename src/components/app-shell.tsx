import type { ReactNode } from "react";

import { MobileHeader } from "@/components/mobile-header";
import { SidebarNavigation } from "@/components/sidebar-navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-muted/35">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-sidebar-border md:block">
        <SidebarNavigation />
      </aside>
      <div className="md:pl-72">
        <MobileHeader />
        <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

