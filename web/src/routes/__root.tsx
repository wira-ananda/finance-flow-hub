import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Navigate,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";

import { AppShell } from "@/components/layout/AppShell";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { canAccessPath } from "@/lib/route-access";
import { SessionProvider, useSession } from "@/providers/session-provider";
import { THEME_INIT_SCRIPT, ThemeProvider } from "@/providers/theme-provider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>

        <h2 className="mt-4 text-xl font-semibold text-foreground">Halaman tidak ditemukan</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);

  const router = useRouter();

  /*
   * Melaporkan error root route ke error reporter milik Lovable.
   */
  useEffect(() => {
    reportLovableError(error, {
      boundary: "tanstack_root_error_component",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Halaman gagal dimuat
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Terjadi kesalahan saat memuat halaman. Silakan coba kembali.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Coba Lagi
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Finance Request Management System",
      },
      {
        name: "description",
        content:
          "Sistem internal pengajuan keuangan lintas unit bisnis: pengajuan, review, persetujuan, dan pembayaran dalam satu alur.",
      },
      {
        property: "og:title",
        content: "Finance Request Management System",
      },
      {
        property: "og:description",
        content: "Kelola pengajuan keuangan unit bisnis secara terpusat dan transparan.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],

    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
        type: "image/x-icon",
      },
    ],
  }),

  shellComponent: RootShell,

  component: RootComponent,

  notFoundComponent: NotFoundComponent,

  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <HeadContent />

        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
      </head>

      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SessionLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span
          className="size-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
          aria-hidden
        />

        <p className="text-sm text-muted-foreground">Memuat sesi pengguna...</p>
      </div>
    </div>
  );
}

function AuthenticatedApplication() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const { role, isAuthenticated, isHydrated } = useSession();

  const isLoginPage = pathname === "/login";

  /*
   * Tunggu hydration agar halaman Login tidak sempat berkedip
   * sebelum session localStorage selesai dipulihkan.
   */
  if (!isHydrated) {
    return <SessionLoadingScreen />;
  }

  if (isLoginPage) {
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }

    return <Outlet />;
  }

  if (!isAuthenticated || !role) {
    return (
      <Navigate
        to="/login"
        search={{
          redirect: pathname,
        }}
        replace
      />
    );
  }

  if (!canAccessPath(role, pathname)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SessionProvider>
          <AuthenticatedApplication />
        </SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
