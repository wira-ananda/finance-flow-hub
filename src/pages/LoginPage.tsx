import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  FlaskConical,
  LogIn,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import {
  APP_NAME,
  APP_NAME_FULL,
  ROLE_LABELS,
} from "@/constants/status";
import { useSession } from "@/providers/session-provider";
import {
  getBusinessUnit,
  listActiveUsers,
} from "@/services/user.service";

interface LoginPageProps {
  redirectTo?: string;
}

export function LoginPage({ redirectTo }: LoginPageProps) {
  const navigate = useNavigate();
  const { login } = useSession();

  const users = useMemo(() => listActiveUsers(), []);

  const [selectedUserId, setSelectedUserId] = useState(
    () => users[0]?.id ?? "",
  );

  const selectedUser = users.find(
    (user) => user.id === selectedUserId,
  );

  const selectedUnit = getBusinessUnit(
    selectedUser?.businessUnitId ?? null,
  );

  const handleLogin = () => {
    if (!selectedUser) return;

    login(selectedUser.id);

    if (redirectTo && redirectTo.startsWith("/")) {
      window.location.assign(redirectTo);
      return;
    }

    void navigate({
      to: "/",
      replace: true,
    });
  };

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
            <p className="text-sm font-semibold text-foreground">
              {APP_NAME}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Finance Management
            </p>
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
            Pengajuan unit bisnis, review Finance, persetujuan,
            pembayaran, surat persetujuan, dan bukti transfer
            berada dalam satu sistem.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card/70 p-4">
              <Building2
                className="mb-3 size-5 text-primary"
                aria-hidden
              />
              <p className="text-sm font-medium text-foreground">
                Lintas Unit Bisnis
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Setiap unit dapat mengelola dan memantau pengajuannya.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card/70 p-4">
              <ShieldCheck
                className="mb-3 size-5 text-primary"
                aria-hidden
              />
              <p className="text-sm font-medium text-foreground">
                Akses Berbasis Role
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Hak akses menyesuaikan tanggung jawab setiap pengguna.
              </p>
            </div>
          </div>
        </section>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="space-y-3 pb-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LogIn className="size-5" aria-hidden />
            </div>

            <div>
              <CardTitle className="text-xl">
                Masuk ke Sistem
              </CardTitle>

              <CardDescription className="mt-1.5">
                Gunakan akun pengujian untuk melanjutkan development.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="rounded-lg border border-status-revision/25 bg-status-revision/8 p-3">
              <div className="flex gap-2.5">
                <FlaskConical
                  className="mt-0.5 size-4 shrink-0 text-status-revision"
                  aria-hidden
                />

                <div>
                  <p className="text-xs font-medium text-foreground">
                    Mode Pengembangan
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Authentication Google belum aktif. Pilih salah satu
                    akun mock untuk menguji role aplikasi.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="mock-user"
                className="text-sm font-medium text-foreground"
              >
                Akun Pengujian
              </label>

              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger id="mock-user" className="h-11 w-full">
                  <SelectValue placeholder="Pilih pengguna" />
                </SelectTrigger>

                <SelectContent>
                  {users.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                      className="py-2"
                    >
                      <span className="flex flex-col">
                        <span className="text-sm font-medium">
                          {user.name}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {ROLE_LABELS[user.role]}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUser ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    {selectedUser.initials}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {selectedUser.name}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {selectedUser.email}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{ROLE_LABELS[selectedUser.role]}</span>

                      {selectedUnit ? (
                        <span>• {selectedUnit.name}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <Button
              type="button"
              className="h-11 w-full"
              disabled={!selectedUser}
              onClick={handleLogin}
            >
              <LogIn className="mr-2 size-4" aria-hidden />
              Masuk sebagai Pengguna Uji
            </Button>

            <div className="border-t border-border pt-4">
              <p className="text-center text-[11px] leading-5 text-muted-foreground">
                Google Sign-In akan menggantikan mock login ketika
                integrasi production authentication dilakukan.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="absolute bottom-4 left-0 right-0 hidden text-center text-[11px] text-muted-foreground lg:block">
        {APP_NAME_FULL}
      </footer>
    </div>
  );
}