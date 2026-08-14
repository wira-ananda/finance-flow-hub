import {
  Link,
  useRouterState,
} from "@tanstack/react-router";
import {
  Bell,
  LogOut,
  Menu,
} from "lucide-react";

import { NAV_ITEMS } from "@/constants/navigation";
import {
  APP_NAME_FULL,
  ROLE_LABELS,
} from "@/constants/status";
import { useSession } from "@/providers/session-provider";
import { getBusinessUnit } from "@/services/user.service";
import { RoleSwitcher } from "./RoleSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function useBreadcrumb() {
  const pathname = useRouterState({
    select: (state) =>
      state.location.pathname,
  });

  const match = NAV_ITEMS.find(
    (item) =>
      item.to !== "/" &&
      (pathname === item.to ||
        pathname.startsWith(`${item.to}/`)),
  );

  if (pathname === "/") {
    return [
      {
        label: "Dashboard",
        to: "/",
      },
    ];
  }

  return [
    {
      label: "Dashboard",
      to: "/",
    },
    {
      label: match?.label ?? "Detail",
      to: pathname,
    },
  ];
}

export function AppHeader({
  onOpenMobileNav,
}: {
  onOpenMobileNav: () => void;
}) {
  const {
    user,
    role,
    logout,
  } = useSession();

  const crumbs = useBreadcrumb();

  if (!user || !role) {
    return null;
  }

  const unit = getBusinessUnit(
    user.businessUnitId,
  );

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        aria-label="Buka navigasi"
      >
        <Menu
          className="size-5"
          aria-hidden
        />
      </button>

      <nav
        aria-label="Breadcrumb"
        className="min-w-0 flex-1"
      >
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, index) => (
            <li
              key={crumb.to}
              className="flex min-w-0 items-center gap-1.5"
            >
              {index > 0 ? (
                <span className="text-muted-foreground">
                  /
                </span>
              ) : null}

              {index ===
              crumbs.length - 1 ? (
                <span className="truncate font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="hidden md:block">
        <RoleSwitcher />
      </div>

      <button
        type="button"
        className="relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Notifikasi"
      >
        <Bell
          className="size-4.5"
          aria-hidden
        />

        <span
          className="absolute right-1 top-1 size-1.5 rounded-full bg-primary"
          aria-hidden
        />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-left transition-colors hover:border-border-strong">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/12 text-xs font-semibold text-primary">
            {user.initials}
          </span>

          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-xs font-medium text-foreground">
              {user.name}
            </span>

            <span className="block truncate text-[11px] text-muted-foreground">
              {ROLE_LABELS[role]}
            </span>
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-64"
        >
          <DropdownMenuLabel className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {user.name}
            </p>

            <p className="text-xs font-normal text-muted-foreground">
              {user.email}
            </p>

            <p className="text-xs font-normal text-muted-foreground">
              {user.jobTitle}
              {unit ? ` · ${unit.name}` : ""}
            </p>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="px-2 py-2">
            <p className="pb-1.5 text-xs font-medium text-muted-foreground">
              Tema Tampilan
            </p>

            <ThemeSwitcher variant="full" />
          </div>

          <DropdownMenuSeparator />

          <div className="px-2 py-2 md:hidden">
            <p className="pb-1.5 text-xs font-medium text-muted-foreground">
              Role Pengembangan
            </p>

            <RoleSwitcher variant="full" />
          </div>

          <DropdownMenuSeparator className="md:hidden" />

          <DropdownMenuItem asChild>
            <Link to="/pengaturan">
              Pengaturan Sistem
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={logout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut
              className="mr-2 size-4"
              aria-hidden
            />
            Keluar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <p className="px-2 py-1.5 text-[11px] text-muted-foreground">
            {APP_NAME_FULL}
          </p>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}