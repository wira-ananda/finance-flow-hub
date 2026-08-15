import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_ITEMS } from "@/constants/navigation";
import { APP_NAME_FULL, ROLE_LABELS } from "@/constants/status";
import { useBusinessUnits } from "@/hooks/use-business-units";
import { getBreadcrumbItems } from "@/lib/navigation";
import { navItemsForRole } from "@/lib/permissions";
import { useSession } from "@/providers/session-provider";

import { ThemeSwitcher } from "./ThemeSwitcher";

export function AppHeader({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { user, role, logout } = useSession();

  const businessUnits = useBusinessUnits();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (!user || !role) {
    return null;
  }

  const navigationItems = navItemsForRole(role, NAV_ITEMS);

  const crumbs = getBreadcrumbItems(pathname, role, navigationItems);

  const unit = businessUnits.find((item) => item.id === user.businessUnitId);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        aria-label="Buka navigasi"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, index) => (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? <span className="text-muted-foreground">/</span> : null}

              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-foreground">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <button
        type="button"
        disabled
        title="Notifikasi akan aktif setelah integrasi backend."
        className="rounded-md p-1.5 text-muted-foreground opacity-60"
        aria-label="Notifikasi belum tersedia"
      >
        <Bell className="size-4.5" aria-hidden />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-left transition-colors hover:border-border-strong">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/12 text-xs font-semibold text-primary">
            {user.initials}
          </span>

          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-xs font-medium text-foreground">{user.name}</span>

            <span className="block truncate text-[11px] text-muted-foreground">
              {ROLE_LABELS[role]}
            </span>
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{user.name}</p>

            <p className="text-xs font-normal text-muted-foreground">{user.email}</p>

            <p className="text-xs font-normal text-muted-foreground">
              {user.jobTitle}

              {unit ? ` · ${unit.name}` : ""}
            </p>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="px-2 py-2">
            <p className="pb-1.5 text-xs font-medium text-muted-foreground">Tema Tampilan</p>

            <ThemeSwitcher variant="full" />
          </div>

          {role === "ADMIN" ? (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link to="/pengaturan">Pengaturan Sistem</Link>
              </DropdownMenuItem>
            </>
          ) : null}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => {
              void logout();
            }}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 size-4" aria-hidden />
            Keluar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <p className="px-2 py-1.5 text-[11px] text-muted-foreground">{APP_NAME_FULL}</p>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
