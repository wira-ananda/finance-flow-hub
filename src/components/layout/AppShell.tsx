import { Link, useRouterState } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { Wallet, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { NAV_ITEMS } from "@/constants/navigation";
import { APP_NAME } from "@/constants/status";
import { getActiveNavigationPath } from "@/lib/navigation";
import { navItemsForRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

const COLLAPSE_KEY = "frms-sidebar-collapsed";

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role } = useSession();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (!open || !role) {
    return null;
  }

  const items = navItemsForRole(role, NAV_ITEMS);

  const activePath = getActiveNavigationPath(pathname, role, items);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-foreground/40"
        onClick={onClose}
        aria-label="Tutup navigasi"
      />

      <div className="relative flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <span className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wallet className="size-4" aria-hidden />
            </span>

            <span className="text-sm font-semibold text-sidebar-foreground">{APP_NAME}</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="Tutup navigasi"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {items.map((item) => {
              const Icon =
                (Icons as unknown as Record<string, Icons.LucideIcon>)[item.icon] ?? Icons.Circle;

              const active = activePath === item.to;

              return (
                <li key={`${item.to}-${item.label}`}>
                  <Link
                    to={item.to}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />

                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);

  /*
   * Memulihkan preferensi collapse sidebar dari localStorage.
   */
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  const toggleSidebar = () => {
    setCollapsed((previous) => {
      const next = !previous;

      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");

      return next;
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggle={toggleSidebar} />

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenMobileNav={() => setMobileOpen(true)} />

        <main className="w-full flex-1 space-y-6 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
