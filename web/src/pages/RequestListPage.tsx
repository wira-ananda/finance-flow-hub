import { Link } from "@tanstack/react-router";
import { FilePlus2, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { RequestTable } from "@/components/requests/RequestTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS_LABELS, STATUS_ORDER } from "@/constants/status";
import { useRequests } from "@/hooks/use-requests";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";
import { getLatestSubmittedAt } from "@/services/request.service";
import type { RequestStatus } from "@/types";

export function RequestListPage() {
  const { user, role } = useSession();

  const all = useRequests(user);

  const [filter, setFilter] = useState<RequestStatus | "ALL">("ALL");

  const [query, setQuery] = useState("");

  const [dateFrom, setDateFrom] = useState("");

  const [dateTo, setDateTo] = useState("");

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return all.filter((request) => {
      const statusMatch = filter === "ALL" || request.status === filter;

      const queryMatch =
        normalizedQuery.length === 0 ||
        request.title.toLowerCase().includes(normalizedQuery) ||
        request.requestNumber.toLowerCase().includes(normalizedQuery);

      const requestDate = (getLatestSubmittedAt(request) ?? request.createdAt).slice(0, 10);

      const fromMatch = !dateFrom || requestDate >= dateFrom;

      const toMatch = !dateTo || requestDate <= dateTo;

      return statusMatch && queryMatch && fromMatch && toMatch;
    });
  }, [all, filter, query, dateFrom, dateTo]);

  const tabs: (RequestStatus | "ALL")[] = ["ALL", ...STATUS_ORDER];

  const hasFilters = filter !== "ALL" || query.trim() !== "" || dateFrom !== "" || dateTo !== "";

  const resetFilters = () => {
    setFilter("ALL");
    setQuery("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <>
      <PageHeader
        title={role === "ADMIN" ? "Seluruh Pengajuan" : "Pengajuan Saya"}
        description="Daftar pengajuan keuangan beserta status terkininya."
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

      <div className="space-y-3">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {tabs.map((tab) => {
            const count =
              tab === "ALL" ? all.length : all.filter((request) => request.status === tab).length;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  filter === tab
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {tab === "ALL" ? "Semua" : STATUS_LABELS[tab]}

                <span className="num text-[11px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_170px_170px_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nomor atau judul pengajuan"
            className="h-9"
          />

          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-9"
            aria-label="Tanggal mulai"
          />

          <Input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-9"
            aria-label="Tanggal akhir"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasFilters}
            onClick={resetFilters}
            className="h-9"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </Button>
        </div>
      </div>
      <RequestTable
        requests={rows}
        showUnit={role !== "UNIT_USER"}
        showRequester={role === "ADMIN"}
        emptyTitle="Tidak ada pengajuan"
        emptyDescription="Sesuaikan filter status, tanggal, atau kata pencarian Anda."
      />
    </>
  );
}
