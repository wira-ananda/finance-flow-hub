import { Pencil, Plus, Power, PowerOff } from "lucide-react";
import { useState } from "react";

import { BusinessUnitDialog } from "@/components/admin/BusinessUnitDialog";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { useBusinessUnits } from "@/hooks/use-business-units";
import { useRequests } from "@/hooks/use-requests";
import { formatRupiahCompact } from "@/lib/formatters";
import { useSession } from "@/providers/session-provider";
import {
  createBusinessUnit,
  setBusinessUnitActive,
  updateBusinessUnit,
  type BusinessUnitInput,
} from "@/services/business-unit.service";
import type { BusinessUnit } from "@/types";

export function BusinessUnitPage() {
  const { user } = useSession();

  const units = useBusinessUnits();

  const requests = useRequests(user);

  const [createOpen, setCreateOpen] = useState(false);

  const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);

  const [pendingStatusUnit, setPendingStatusUnit] = useState<BusinessUnit | null>(null);

  const [pageError, setPageError] = useState<string | null>(null);

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

  const handleSave = (input: BusinessUnitInput, unit?: BusinessUnit): boolean => {
    setPageError(null);

    try {
      if (unit) {
        updateBusinessUnit(user, unit.id, input);
      } else {
        createBusinessUnit(user, input);
      }

      return true;
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Gagal menyimpan Unit Bisnis.");

      return false;
    }
  };

  return (
    <>
      <PageHeader
        title="Unit Bisnis"
        description="Kelola Unit Bisnis dan lihat ringkasan pengajuan keuangannya."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Tambah Unit
          </Button>
        }
      />

      {pageError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {pageError}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {units.map((unit) => {
          const unitRequests = requests.filter((request) => request.businessUnitId === unit.id);

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
                  onClick={() => setEditingUnit(unit)}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setPendingStatusUnit(unit)}
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

      {createOpen ? (
        <BusinessUnitDialog
          key="create-unit"
          open
          onOpenChange={setCreateOpen}
          onSubmit={(input) => handleSave(input)}
        />
      ) : null}

      {editingUnit ? (
        <BusinessUnitDialog
          key={editingUnit.id}
          open
          unit={editingUnit}
          onOpenChange={(open) => {
            if (!open) {
              setEditingUnit(null);
            }
          }}
          onSubmit={(input) => handleSave(input, editingUnit)}
        />
      ) : null}

      <ConfirmationDialog
        open={pendingStatusUnit !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingStatusUnit(null);
          }
        }}
        title={pendingStatusUnit?.active ? "Nonaktifkan Unit Bisnis" : "Aktifkan Unit Bisnis"}
        description={
          pendingStatusUnit?.active
            ? "Unit hanya dapat dinonaktifkan jika tidak memiliki pengguna aktif."
            : "Unit Bisnis akan kembali tersedia untuk pengguna."
        }
        confirmLabel={pendingStatusUnit?.active ? "Nonaktifkan" : "Aktifkan"}
        destructive={pendingStatusUnit?.active}
        onConfirm={() => {
          if (!pendingStatusUnit) {
            return;
          }

          setPageError(null);

          try {
            setBusinessUnitActive(user, pendingStatusUnit.id, !pendingStatusUnit.active);

            setPendingStatusUnit(null);
          } catch (error) {
            setPageError(
              error instanceof Error ? error.message : "Gagal mengubah status Unit Bisnis.",
            );
          }
        }}
      />
    </>
  );
}
