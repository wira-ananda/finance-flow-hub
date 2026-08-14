import { Link, useRouterState } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { ChevronLeft, Wallet } from "lucide-react";

import { NAV_GROUP_ORDER, NAV_ITEMS } from "@/constants/navigation";
import { APP_NAME, ROLE_LABELS } from "@/constants/status";
import { getActiveNavigationPath } from "@/lib/navigation";
import { navItemsForRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle;

  return <Icon className={className} aria-hidden />;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { role } = useSession();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (!role) {
    return null;
  }

  const items = navItemsForRole(role, NAV_ITEMS);

  const activePath = getActiveNavigationPath(pathname, role, items);

  return (
    <aside
      className={cn(
        /*
         * Sidebar selalu mengikuti tinggi viewport,
         * bukan tinggi seluruh halaman.
         */
        "sticky top-0 hidden h-screen shrink-0 self-start flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-[236px]",
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Wallet className="size-4" aria-hidden />
        </span>

        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{APP_NAME}</p>

            <p className="truncate text-[11px] text-muted-foreground">Management System</p>
          </div>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUP_ORDER.map((group) => {
          const groupItems = items.filter((item) => item.group === group);

          if (groupItems.length === 0) {
            return null;
          }

          return (
            <div key={group} className="mb-4 last:mb-0">
              {!collapsed ? (
                <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {group}
                </p>
              ) : null}

              <ul className="space-y-0.5">
                {groupItems.map((item) => {
                  const active = activePath === item.to;

                  return (
                    <li key={`${item.to}-${item.label}`}>
                      <Link
                        to={item.to}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                          collapsed && "justify-center px-0",
                        )}
                      >
                        {active ? (
                          <span
                            className="absolute left-0 h-5 w-0.5 rounded-r bg-sidebar-primary"
                            aria-hidden
                          />
                        ) : null}

                        <NavIcon name={item.icon} className="size-4 shrink-0" />

                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-2">
        {!collapsed ? (
          <p className="px-2.5 pb-2 text-[11px] text-muted-foreground">
            Mode akses: <span className="text-sidebar-foreground">{ROLE_LABELS[role]}</span>
          </p>
        ) : null}

        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Tampilkan menu" : "Sembunyikan menu"}
        >
          <ChevronLeft
            className={cn("size-4 transition-transform", collapsed && "rotate-180")}
            aria-hidden
          />

          {!collapsed ? <span>Sembunyikan menu</span> : null}
        </button>
      </div>
    </aside>
  );
}
