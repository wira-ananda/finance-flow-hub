import { Pencil, Power, PowerOff } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";

import { Button } from "@/components/ui/button";

import { formatRupiahCompact } from "@/lib/formatters";

import type { BusinessUnit, FinanceRequest } from "@/types";

interface BusinessUnitCardProps {
  unit: BusinessUnit;

  requests: FinanceRequest[];

  disabled?: boolean;

  onEdit: (unit: BusinessUnit) => void;

  onToggleActive: (unit: BusinessUnit) => void;
}

export function BusinessUnitCard({
  unit,
  requests,
  disabled = false,
  onEdit,
  onToggleActive,
}: BusinessUnitCardProps) {
  const total = requests.reduce((sum, request) => sum + request.amount, 0);

  const latest = requests[0];

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="num text-xs font-medium tracking-wide text-primary uppercase">
            {unit.code}
          </p>

          <h2 className="mt-1 truncate text-sm font-semibold text-foreground">{unit.name}</h2>

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

          <dd className="num font-semibold text-foreground">{requests.length}</dd>
        </div>

        <div>
          <dt className="text-xs text-muted-foreground">Total Nilai</dt>

          <dd className="num font-semibold text-foreground">{formatRupiahCompact(total)}</dd>
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
          disabled={disabled}
          onClick={() => onEdit(unit)}
        >
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={disabled}
          onClick={() => onToggleActive(unit)}
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
}
