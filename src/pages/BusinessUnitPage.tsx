import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatRupiahCompact } from "@/lib/formatters";
import { MOCK_REQUESTS } from "@/data/mock/requests";
import { listBusinessUnits } from "@/services/user.service";

export function BusinessUnitPage() {
  const units = listBusinessUnits();

  return (
    <>
      <PageHeader
        title="Unit Bisnis"
        description="Unit bisnis yang terdaftar beserta ringkasan pengajuannya (data contoh)."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {units.map((unit) => {
          const requests = MOCK_REQUESTS.filter((request) => request.businessUnitId === unit.id);
          const total = requests.reduce((sum, request) => sum + request.amount, 0);
          const latest = requests[0];

          return (
            <article
              key={unit.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-card"
            >
              <div>
                <p className="num text-xs font-medium tracking-wide text-primary uppercase">
                  {unit.code}
                </p>
                <h2 className="mt-1 text-sm font-semibold text-foreground">{unit.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {unit.costCenter} · Manajer {unit.managerName}
                </p>

              </div>
              <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Pengajuan</dt>
                  <dd className="num font-semibold text-foreground">{requests.length}</dd>
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
            </article>
          );
        })}
      </div>
    </>
  );
}
