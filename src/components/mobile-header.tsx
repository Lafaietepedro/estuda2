"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

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
  users: { id: string; name: string }[];
};

export function MobileHeader({ examName, users }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
      <AppLogo />
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
            users={users}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </header>
  );
}
