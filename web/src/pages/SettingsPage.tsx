import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";

import { PageHeader } from "@/components/common/PageHeader";

import { RoleSwitcher } from "@/components/layout/RoleSwitcher";

import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

import { Switch } from "@/components/ui/switch";

import { useSystemSettings } from "@/hooks/use-system-settings";

import { useSession } from "@/providers/session-provider";

import { updateSystemSettings } from "@/services/system-settings.service";

export function SettingsPage() {
  const { user } = useSession();

  const settings = useSystemSettings();

  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  if (user.role !== "ADMIN") {
    return (
      <>
        <PageHeader title="Pengaturan Sistem" />

        <EmptyState
          title="Akses tidak tersedia"
          description="Halaman ini hanya tersedia untuk Administrator."
        />
      </>
    );
  }

  const updateSetting = (
    key: "emailNotificationsEnabled" | "requesterStatusNotificationsEnabled",
    checked: boolean,
  ) => {
    setError(null);

    try {
      updateSystemSettings(user, {
        ...settings,

        [key]: checked,
      });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Pengaturan gagal diperbarui.");
    }
  };

  return (
    <>
      <PageHeader
        title="Pengaturan Sistem"
        description="Preferensi tampilan dan pengaturan development Finance Request."
      />

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Tema Tampilan</h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Pilih tema terang, gelap, atau mengikuti sistem.
          </p>
        </div>

        <ThemeSwitcher variant="full" />
      </section>

      {import.meta.env.DEV ? (
        <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Role Pengembangan</h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Berpindah role menggunakan user aktif yang berasal dari Finance API.
            </p>
          </div>

          <RoleSwitcher variant="full" />
        </section>
      ) : null}

      <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Notifikasi</h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Pengaturan ini masih menggunakan repository development lokal sampai backend notifikasi
            tersedia.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium text-foreground">Notifikasi Email</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Mengaktifkan pengiriman notifikasi email dari sistem.
            </p>
          </div>

          <Switch
            checked={settings.emailNotificationsEnabled}
            onCheckedChange={(checked) => updateSetting("emailNotificationsEnabled", checked)}
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium text-foreground">Notifikasi Status ke Pemohon</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Mengirim perubahan status pengajuan kepada pemohon.
            </p>
          </div>

          <Switch
            checked={settings.requesterStatusNotificationsEnabled}
            onCheckedChange={(checked) =>
              updateSetting("requesterStatusNotificationsEnabled", checked)
            }
          />
        </div>
      </section>
    </>
  );
}
