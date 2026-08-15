import { Pencil, Plus, Power, PowerOff } from "lucide-react";

import { useMemo } from "react";

import { EmptyState } from "@/components/common/EmptyState";

import { ErrorState } from "@/components/common/ErrorState";

import { LoadingState } from "@/components/common/LoadingState";

import { PageHeader } from "@/components/common/PageHeader";

import { StatusBadge } from "@/components/common/StatusBadge";

import { Button } from "@/components/ui/button";

import { useBusinessUnitsQuery } from "@/hooks/use-business-units";

import { useRequestsQuery } from "@/hooks/use-requests";

import { formatRupiahCompact } from "@/lib/formatters";

import { useSession } from "@/providers/session-provider";

export function BusinessUnitPage() {
  const { user } = useSession();

  const unitsQuery = useBusinessUnitsQuery();

  const requestsQuery = useRequestsQuery(user);

  if (!user) {
    return null;
  }

  if (user.role !== "ADMIN") {
    return (
      <>
        <PageHeader title="Unit Bisnis" />

        <EmptyState
          title="Akses tidak tersedia"
          description="Halaman ini hanya tersedia untuk Administrator."
        />
      </>
    );
  }

  if (unitsQuery.isPending || requestsQuery.isPending) {
    return (
      <>
        <PageHeader
          title="Unit Bisnis"
          description="Data Unit Bisnis dibaca langsung dari Finance API."
        />

        <LoadingState rows={6} />
      </>
    );
  }

  const loadError = unitsQuery.error ?? requestsQuery.error;

  if (loadError) {
    return (
      <>
        <PageHeader title="Unit Bisnis" />

        <ErrorState
          title="Unit Bisnis gagal dimuat"
          description={loadError.message}
          onRetry={() => {
            void Promise.all([unitsQuery.refetch(), requestsQuery.refetch()]);
          }}
        />
      </>
    );
  }

  const units = unitsQuery.data ?? [];

  const requests = requestsQuery.data ?? [];

  const requestsByUnit = useMemo(() => {
    const grouped = new Map<string, typeof requests>();

    requests.forEach((request) => {
      const current = grouped.get(request.businessUnitId) ?? [];

      current.push(request);

      grouped.set(request.businessUnitId, current);
    });

    return grouped;
  }, [requests]);

  return (
    <>
      <PageHeader
        title="Unit Bisnis"
        description="Master Unit Bisnis dan ringkasan pengajuan dari backend."
        actions={
          <Button
            type="button"
            disabled
            title="Endpoint tambah Unit Bisnis belum tersedia di backend."
          >
            <Plus className="size-4" aria-hidden />
            Tambah Unit
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-background-subtle px-4 py-3 text-sm text-muted-foreground">
        Penambahan, perubahan, dan aktivasi Unit Bisnis belum dihubungkan karena Web API saat ini
        baru menyediakan endpoint baca untuk master Unit Bisnis.
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {units.map((unit) => {
          const unitRequests = requestsByUnit.get(unit.id) ?? [];

          const total = unitRequests.reduce((sum, request) => sum + request.amount, 0);

          const latest = unitRequests[0];

          return (
            <article
              key={unit.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="num text-xs font-medium tracking-wide text-primary uppercase">
                    {unit.code}
                  </p>

                  <h2 className="mt-1 truncate text-sm font-semibold text-foreground">
                    {unit.name}
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {unit.costCenter}
                    {" · "}
                    Manajer {unit.managerName}
                  </p>
                </div>

                <span
                  className={
                    unit.active
                      ? "status-approved inline-flex rounded-md px-2 py-0.5 text-xs font-medium"
                      : "status-draft inline-flex rounded-md px-2 py-0.5 text-xs font-medium"
                  }
                >
                  {unit.active ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Pengajuan</dt>

                  <dd className="num font-semibold text-foreground">{unitRequests.length}</dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">Total Nilai</dt>

                  <dd className="num font-semibold text-foreground">
                    {formatRupiahCompact(total)}
                  </dd>
                </div>
              </dl>

              {latest ? (
                <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="truncate text-xs text-muted-foreground">{latest.title}</span>

                  <StatusBadge status={latest.status} />
                </div>
              ) : null}

              <div className="mt-auto flex gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled
                  title="Endpoint perubahan Unit Bisnis belum tersedia di backend."
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled
                  title="Endpoint perubahan status Unit Bisnis belum tersedia di backend."
                >
                  {unit.active ? (
                    <PowerOff className="size-3.5" aria-hidden />
                  ) : (
                    <Power className="size-3.5" aria-hidden />
                  )}

                  {unit.active ? "Nonaktif" : "Aktifkan"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
