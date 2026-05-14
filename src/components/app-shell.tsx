"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  KanbanSquare,
  CalendarDays,
  Target,
  PackageX,
  Users,
  LogOut,
  Menu,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AppUser } from "@/lib/session";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/kanban", label: "Kanban de criativos", icon: KanbanSquare },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/rupturas", label: "Rupturas", icon: PackageX },
  { href: "/admin/users", label: "Usuários", icon: Users, adminOnly: true },
];

export function AppShell({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user.role === "ADMIN";
  const initial = (user.name ?? user.email).slice(0, 1).toUpperCase();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navItems = NAV.filter((item) => !item.adminOnly || isAdmin);
  const currentNav = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </>
    );
  }

  function UserFooter() {
    return (
      <div className="border-t p-3 flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name ?? user.email}</p>
          <p className="text-xs text-sidebar-foreground/60 truncate">{user.role}</p>
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="h-14 flex items-center px-4 border-b">
          <span className="font-semibold tracking-tight">Dash Criativos</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <NavLinks />
        </nav>
        <UserFooter />
      </aside>

      <header className="md:hidden h-14 shrink-0 flex items-center gap-2 px-3 border-b bg-sidebar text-sidebar-foreground">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" aria-label="Abrir menu" />}
          >
            <Menu className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 max-w-[80vw] p-0 bg-sidebar text-sidebar-foreground"
          >
            <SheetHeader className="h-14 justify-center border-b">
              <SheetTitle>Dash Criativos</SheetTitle>
              <SheetDescription className="sr-only">
                Navegação principal do dashboard.
              </SheetDescription>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
            <UserFooter />
          </SheetContent>
        </Sheet>
        <span className="font-semibold tracking-tight truncate">
          {currentNav?.label ?? "Dash Criativos"}
        </span>
      </header>

      <main className="flex-1 min-w-0 flex flex-col">{children}</main>
    </div>
  );
}
