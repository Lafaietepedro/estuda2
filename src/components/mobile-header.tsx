"use client";

import { useState } from "react";
import { Menu, Sparkles } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { SidebarNavigation } from "@/components/sidebar-navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileHeaderProps = {
  examName: string;
  currentUser: { name: string; role: "OWNER" | "MEMBER" };
  users: { id: string; name: string }[];
};

export function MobileHeader({
  examName,
  currentUser,
  users,
}: MobileHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card/85 px-4 shadow-sm backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <AppLogo compact />
        <div className="leading-tight">
          <p className="font-serif text-lg font-bold">Estuda2</p>
          <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="size-3 text-secondary" aria-hidden="true" />
            Hoje · {currentUser.name}
          </p>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="p-0">
          <SheetTitle className="sr-only">Menu principal</SheetTitle>
          <SheetDescription className="sr-only">
            Escolha uma área do Estuda2 para navegar.
          </SheetDescription>
          <SidebarNavigation
            examName={examName}
            currentUser={currentUser}
            users={users}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </header>
  );
}
