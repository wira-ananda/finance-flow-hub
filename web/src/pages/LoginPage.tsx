import { Building2, ShieldCheck, Wallet } from "lucide-react";

import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { APP_NAME, APP_NAME_FULL } from "@/constants/status";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

interface LoginPageProps {
  redirectTo?: string;

  errorCode?: string;
}

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  GOOGLE_CREDENTIAL_MISSING: "Credential Google tidak diterima.",

  GOOGLE_CSRF_FAILED: "Validasi keamanan login gagal. Silakan coba kembali.",

  GOOGLE_IDENTITY_INVALID: "Identitas Google tidak valid.",

  GOOGLE_DOMAIN_NOT_ALLOWED: "Akun Google ini tidak termasuk domain perusahaan.",

  ACCOUNT_NOT_REGISTERED: "Email Google Anda belum terdaftar di Finance Request System.",

  ACCOUNT_INACTIVE: "Akun Finance Request Anda sedang tidak aktif.",

  AUTH_CONFIGURATION_ERROR: "Konfigurasi Google Login belum lengkap.",

  GOOGLE_LOGIN_FAILED: "Login dengan Google gagal. Silakan coba kembali.",
};

function sanitizeRedirect(value?: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function LoginPage({ redirectTo, errorCode }: LoginPageProps) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  const loginUri = import.meta.env.VITE_GOOGLE_LOGIN_URI?.trim();

  const configurationReady = Boolean(clientId && loginUri);

  const errorMessage = errorCode
    ? (LOGIN_ERROR_MESSAGES[errorCode] ?? "Login gagal. Silakan coba kembali.")
    : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_35%)]"
        aria-hidden
      />

      <header className="relative z-10 flex h-16 items-center justify-between border-b border-border/70 px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="size-4.5" aria-hidden />
          </span>

          <div>
            <p className="text-sm font-semibold text-foreground">{APP_NAME}</p>

            <p className="text-[11px] text-muted-foreground">Finance Management</p>
          </div>
        </div>

        <ThemeSwitcher />
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-[1fr_440px] lg:px-8">
        <section className="hidden max-w-xl lg:block">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" aria-hidden />
            Sistem Internal Perusahaan
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground xl:text-5xl">
            Kelola pengajuan keuangan dalam satu alur yang terstruktur.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            Pengajuan unit bisnis, review Finance, persetujuan, pembayaran, surat persetujuan, dan
            bukti transfer berada dalam satu sistem.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card/70 p-4">
              <Building2 className="mb-3 size-5 text-primary" aria-hidden />

              <p className="text-sm font-medium text-foreground">Lintas Unit Bisnis</p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Setiap unit dapat mengelola dan memantau pengajuannya.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card/70 p-4">
              <ShieldCheck className="mb-3 size-5 text-primary" aria-hidden />

              <p className="text-sm font-medium text-foreground">Akses Berbasis Role</p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Role dan hak akses berasal dari akun pengguna terdaftar.
              </p>
            </div>
          </div>
        </section>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="space-y-3 pb-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-5" aria-hidden />
            </div>

            <div>
              <CardTitle className="text-xl">Masuk ke Sistem</CardTitle>

              <CardDescription className="mt-1.5">
                Gunakan akun Google yang terdaftar pada Finance Request System.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {errorMessage ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            ) : null}

            {!configurationReady ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                Konfigurasi Google Login belum lengkap.
              </div>
            ) : (
              <GoogleSignInButton clientId={clientId} loginUri={loginUri} />
            )}

            <div className="border-t border-border pt-4">
              <p className="text-center text-[11px] leading-5 text-muted-foreground">
                Hanya akun Google dengan email yang terdaftar dan aktif pada Finance Request System
                yang dapat masuk.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="absolute right-0 bottom-4 left-0 hidden text-center text-[11px] text-muted-foreground lg:block">
        {APP_NAME_FULL}
      </footer>
    </div>
  );
}
