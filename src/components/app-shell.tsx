import type { ReactNode } from "react";

import { MobileHeader } from "@/components/mobile-header";
import { SidebarNavigation } from "@/components/sidebar-navigation";
import { getWorkspace } from "@/lib/data";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const workspace = await getWorkspace();
  const navigationContext = {
    examName: workspace.name,
    currentUser: {
      name: workspace.currentUser.name,
      role: workspace.currentMembership.role,
    },
    users: workspace.memberships.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
    })),
  };

  return (
    <div className="min-h-screen bg-muted/35">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-sidebar-border md:block">
        <SidebarNavigation {...navigationContext} />
      </aside>
      <div className="md:pl-72">
        <MobileHeader {...navigationContext} />
        <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
