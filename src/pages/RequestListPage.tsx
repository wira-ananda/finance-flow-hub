import { Link } from "@tanstack/react-router";
import { FilePlus2 } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { RequestTable } from "@/components/requests/RequestTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS_LABELS, STATUS_ORDER } from "@/constants/status";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";
import { listRequests } from "@/services/request.service";
import type { RequestStatus } from "@/types";

export function RequestListPage() {
  const { user, role } = useSession();
  const all = listRequests(user);
  const [filter, setFilter] = useState<RequestStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((request) => {
      const statusMatch = filter === "ALL" || request.status === filter;
      const queryMatch =
        q.length === 0 ||
        request.title.toLowerCase().includes(q) ||
        request.requestNumber.toLowerCase().includes(q);
      return statusMatch && queryMatch;
    });
  }, [all, filter, query]);

  const tabs: (RequestStatus | "ALL")[] = ["ALL", ...STATUS_ORDER];

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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {tabs.map((tab) => {
            const count = tab === "ALL" ? all.length : all.filter((r) => r.status === tab).length;
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
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nomor atau judul pengajuan"
          className="h-9 lg:w-72"
        />
      </div>

      <RequestTable
        requests={rows}
        showRequester={role === "ADMIN"}
        emptyTitle="Tidak ada pengajuan"
        emptyDescription="Sesuaikan filter status atau kata pencarian Anda."
      />
    </>
  );
}
