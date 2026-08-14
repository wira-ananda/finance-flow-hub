import { Link } from "@tanstack/react-router";
import { ArrowRight, FilePlus2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RequestTable } from "@/components/requests/RequestTable";
import { Button } from "@/components/ui/button";
import { ACTIVITY_LABELS, ROLE_LABELS, STATUS_ORDER } from "@/constants/status";
import { useBusinessUnits } from "@/hooks/use-business-units";
import { useRequests } from "@/hooks/use-requests";
import { useUsers } from "@/hooks/use-users";
import { formatRelatif, formatRupiahCompact } from "@/lib/formatters";
import { useSession } from "@/providers/session-provider";
import { countByStatus, getDashboardStats } from "@/services/request.service";
import type { UserRole } from "@/types";

const ROLE_DESCRIPTION: Record<UserRole, string> = {
  UNIT_USER: "Pantau pengajuan keuangan unit Anda dan tindak lanjuti permintaan revisi.",
  FINANCE_REVIEWER: "Tinjau pengajuan masuk, minta revisi, setujui, atau tolak pengajuan.",
  FINANCE_PAYMENT: "Proses pembayaran pengajuan yang telah disetujui dan unggah bukti transfer.",
  ADMIN: "Pantau seluruh aktivitas pengajuan, pengguna, dan unit bisnis.",
};

type AllRequestRoute = "/pengajuan" | "/review" | "/pembayaran";

function getAllRoute(role: UserRole): AllRequestRoute {
  switch (role) {
    case "FINANCE_REVIEWER":
      return "/review";
    case "FINANCE_PAYMENT":
      return "/pembayaran";
    default:
      return "/pengajuan";
  }
}

export function DashboardPage() {
  const { user, role } = useSession();

  const requests = useRequests(user);
  const users = useUsers();
  const businessUnits = useBusinessUnits();

  if (!user || !role) {
    return null;
  }

  const stats = getDashboardStats(user, requests, {
    activeUserCount: users.filter((item) => item.active).length,
    businessUnitCount: businessUnits.length,
  });

  const counts = countByStatus(requests);

  const unit = businessUnits.find((item) => item.id === user.businessUnitId);

  const recent = requests.slice(0, 5);
  const totalRequests = requests.length;

  const totalAmount = requests.reduce((total, request) => total + request.amount, 0);

  const allRoute = getAllRoute(role);

  return (
    <>
      <PageHeader
        title={`Selamat datang, ${user.name.split(" ")[0]}`}
        description={ROLE_DESCRIPTION[role]}
        actions={
          role === "UNIT_USER" ? (
            <Button asChild className="bg-primary hover:bg-primary-hover">
              <Link to="/pengajuan/baru">
                <FilePlus2 className="size-4" aria-hidden />
                Buat Pengajuan
              </Link>
            </Button>
          ) : null
        }
      />

      <section className="surface-emphasis flex flex-col gap-4 rounded-lg border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Konteks Akses
          </p>

          <p className="text-lg font-semibold text-foreground">
            {ROLE_LABELS[role]}
            {unit ? ` · ${unit.name}` : " · Seluruh Unit Bisnis"}
          </p>

          <p className="text-sm text-muted-foreground">
            {user.jobTitle} · {requests.length} pengajuan dapat Anda akses
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs text-muted-foreground">Total nilai pengajuan</p>

          <p className="num text-2xl font-semibold text-foreground">
            {formatRupiahCompact(totalAmount)}
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-sm font-semibold text-foreground">Distribusi Status</h2>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Berdasarkan pengajuan yang dapat Anda akses
          </p>

          <ul className="mt-4 space-y-3">
            {STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => (
              <li key={status} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <StatusBadge status={status} />

                  <span className="num text-muted-foreground">{counts[status]}</span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width:
                        totalRequests > 0 ? `${(counts[status] / totalRequests) * 100}%` : "0%",
                    }}
                  />
                </div>
              </li>
            ))}

            {totalRequests === 0 ? (
              <li className="text-sm text-muted-foreground">Belum ada data status.</li>
            ) : null}
          </ul>
        </div>

        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Pengajuan Terbaru</h2>

            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link to={allRoute}>
                Lihat semua
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </div>

          <RequestTable
            requests={recent}
            showUnit={role !== "UNIT_USER"}
            showRequester={role !== "UNIT_USER"}
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">Aktivitas Terkini</h2>

        <ul className="mt-3 divide-y divide-border">
          {recent.map((request) => {
            const lastActivity = request.activities[request.activities.length - 1];

            return (
              <li key={request.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    <span className="num text-xs text-primary">{request.requestNumber}</span>
                    {" · "}
                    {request.title}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {lastActivity ? ACTIVITY_LABELS[lastActivity.action] : "Belum ada aktivitas"}
                    {" · "}
                    {lastActivity?.actorName ?? "-"}
                    {" · "}
                    {formatRelatif(lastActivity?.createdAt ?? request.updatedAt)}
                  </p>
                </div>

                <StatusBadge status={request.status} />
              </li>
            );
          })}

          {recent.length === 0 ? (
            <li className="py-3 text-sm text-muted-foreground">Belum ada aktivitas.</li>
          ) : null}
        </ul>
      </section>
    </>
  );
}
