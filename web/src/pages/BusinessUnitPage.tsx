import { useState } from "react";

import { Plus } from "lucide-react";

import { BusinessUnitCard } from "@/components/admin/BusinessUnitCard";

import { BusinessUnitDialog } from "@/components/admin/BusinessUnitDialog";

import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

import { EmptyState } from "@/components/common/EmptyState";

import { ErrorState } from "@/components/common/ErrorState";

import { LoadingState } from "@/components/common/LoadingState";

import { PageHeader } from "@/components/common/PageHeader";

import { Button } from "@/components/ui/button";

import { useBusinessUnitMutation, useBusinessUnitsQuery } from "@/hooks/use-business-units";

import { useRequestsQuery } from "@/hooks/use-requests";

import { useSession } from "@/providers/session-provider";

import type { BusinessUnitInput } from "@/services/business-unit.service";

import type { BusinessUnit, FinanceRequest } from "@/types";

/**
 * Mengelompokkan pengajuan berdasarkan Unit Bisnis.
 */
function groupRequestsByBusinessUnit(requests: FinanceRequest[]): Map<string, FinanceRequest[]> {
  const grouped = new Map<string, FinanceRequest[]>();

  requests.forEach((request) => {
    const current = grouped.get(request.businessUnitId) ?? [];

    current.push(request);

    grouped.set(request.businessUnitId, current);
  });

  return grouped;
}

export function BusinessUnitPage() {
  const { user } = useSession();

  const unitsQuery = useBusinessUnitsQuery();

  const requestsQuery = useRequestsQuery(user);

  const unitMutation = useBusinessUnitMutation(user);

  const [unitDialogOpen, setUnitDialogOpen] = useState(false);

  const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);

  const [statusTarget, setStatusTarget] = useState<BusinessUnit | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

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

  const requestsByUnit = groupRequestsByBusinessUnit(requests);

  const handleCreate = () => {
    setActionError(null);

    setEditingUnit(null);

    setUnitDialogOpen(true);
  };

  const handleEdit = (unit: BusinessUnit) => {
    setActionError(null);

    setEditingUnit(unit);

    setUnitDialogOpen(true);
  };

  const handleSubmitUnit = async (input: BusinessUnitInput): Promise<boolean> => {
    if (unitMutation.isPending) {
      return false;
    }

    setActionError(null);

    try {
      if (editingUnit) {
        await unitMutation.mutateAsync({
          type: "UPDATE",

          businessUnitId: editingUnit.id,

          input,
        });
      } else {
        await unitMutation.mutateAsync({
          type: "CREATE",

          input,
        });
      }

      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unit Bisnis gagal disimpan.");
    }
  };

  const handleConfirmStatus = async (): Promise<boolean> => {
    if (!statusTarget || unitMutation.isPending) {
      return false;
    }

    setActionError(null);

    try {
      await unitMutation.mutateAsync({
        type: "SET_ACTIVE",

        businessUnitId: statusTarget.id,

        isActive: !statusTarget.active,
      });

      setStatusTarget(null);

      return true;
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Status Unit Bisnis gagal diperbarui.",
      );

      return false;
    }
  };

  return (
    <>
      <PageHeader
        title="Unit Bisnis"
        description="Kelola master Unit Bisnis, cost center, manajer, dan status operasional."
        actions={
          <Button type="button" disabled={unitMutation.isPending} onClick={handleCreate}>
            <Plus className="size-4" aria-hidden />
            Tambah Unit
          </Button>
        }
      />

      {actionError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {actionError}
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-background-subtle px-4 py-3 text-sm text-muted-foreground">
        Unit Bisnis tidak dihapus permanen agar histori pengajuan tetap konsisten. Unit yang sudah
        tidak digunakan dapat dinonaktifkan setelah tidak memiliki pengguna aktif.
      </div>

      {units.length === 0 ? (
        <EmptyState
          title="Belum ada Unit Bisnis"
          description="Tambahkan Unit Bisnis pertama untuk mulai mengatur akses pengguna Unit Bisnis."
          action={
            <Button type="button" onClick={handleCreate}>
              <Plus className="size-4" aria-hidden />
              Tambah Unit
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {units.map((unit) => (
            <BusinessUnitCard
              key={unit.id}
              unit={unit}
              requests={requestsByUnit.get(unit.id) ?? []}
              disabled={unitMutation.isPending}
              onEdit={handleEdit}
              onToggleActive={(selectedUnit) => {
                setActionError(null);

                setStatusTarget(selectedUnit);
              }}
            />
          ))}
        </div>
      )}

      {unitDialogOpen ? (
        <BusinessUnitDialog
          key={editingUnit?.id ?? "new-business-unit"}
          open
          unit={editingUnit ?? undefined}
          onOpenChange={(open) => {
            setUnitDialogOpen(open);

            if (!open) {
              setEditingUnit(null);
            }
          }}
          onSubmit={handleSubmitUnit}
        />
      ) : null}

      <ConfirmationDialog
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open && !unitMutation.isPending) {
            setStatusTarget(null);
          }
        }}
        title={statusTarget?.active ? "Nonaktifkan Unit Bisnis" : "Aktifkan Unit Bisnis"}
        description={
          statusTarget?.active
            ? `Unit ${statusTarget.name} tidak dapat dipakai untuk pengguna baru setelah dinonaktifkan. Sistem akan menolak proses jika masih ada pengguna aktif pada unit ini.`
            : `Unit ${statusTarget?.name ?? "ini"} akan kembali tersedia untuk pengguna Unit Bisnis.`
        }
        confirmLabel={statusTarget?.active ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
        destructive={Boolean(statusTarget?.active)}
        onConfirm={handleConfirmStatus}
      />
    </>
  );
}
