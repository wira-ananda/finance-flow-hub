import { PageHeader } from "@/components/common/PageHeader";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import { ROLE_LABELS, STATUS_LABELS, STATUS_ORDER } from "@/constants/status";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useSession } from "@/providers/session-provider";
import { getBusinessUnit } from "@/services/user.service";

export function SettingsPage() {
  const { user, role } = useSession();
  const unit = getBusinessUnit(user.businessUnitId);

  return (
    <>
      <PageHeader
        title="Pengaturan Sistem"
        description="Preferensi tampilan dan konteks akses pengguna saat ini."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-sm font-semibold text-foreground">Tampilan</h2>
          <p className="text-sm text-muted-foreground">
            Pilih mode tampilan Terang, Gelap, atau mengikuti pengaturan sistem.
          </p>
          <ThemeSwitcher variant="full" />
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-sm font-semibold text-foreground">Role Pengembangan</h2>
          <p className="text-sm text-muted-foreground">
            Pengalih role sementara untuk keperluan pengembangan. Autentikasi sesungguhnya belum
            diaktifkan.
          </p>
          <RoleSwitcher variant="full" />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">Profil Aktif</h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Nama", value: user.name },
            { label: "Role", value: ROLE_LABELS[role] },
            { label: "Unit Bisnis", value: unit ? unit.name : "Seluruh Unit" },
            { label: "Jabatan", value: user.jobTitle },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="text-sm font-medium text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">Referensi Status Pengajuan</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_ORDER.map((status) => (
            <li key={status} className="flex items-center gap-2">
              <StatusBadge status={status} />
              <span className="text-xs text-muted-foreground">{STATUS_LABELS[status]}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
