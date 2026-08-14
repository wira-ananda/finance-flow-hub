import { Link } from "@tanstack/react-router";
import { History, RotateCcw } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { RequestTable } from "@/components/requests/RequestTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS } from "@/constants/status";
import { useBusinessUnits } from "@/hooks/use-business-units";
import { useRequests } from "@/hooks/use-requests";
import { useSession } from "@/providers/session-provider";
import { getDashboardStats } from "@/services/request.service";
import type { RequestStatus } from "@/types";

const REVIEW_QUEUE_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "REVISION_REQUIRED"] as const;

type QueueStatus = "ALL" | (typeof REVIEW_QUEUE_STATUSES)[number];

const QUEUE_STATUS_OPTIONS: QueueStatus[] = ["ALL", ...REVIEW_QUEUE_STATUSES];

export function ReviewQueuePage() {
  const { user } = useSession();

  const requests = useRequests(user);
  const units = useBusinessUnits();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<QueueStatus>("ALL");
  const [businessUnitId, setBusinessUnitId] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  if (!user) {
    return null;
  }

  if (user.role !== "FINANCE_REVIEWER") {
    return (
      <>
        <PageHeader title="Antrean Review" />

        <EmptyState
          title="Akses tidak tersedia"
          description="Halaman ini hanya tersedia untuk Finance Reviewer."
          action={
            <Button asChild variant="outline">
              <Link to="/">Kembali ke Dashboard</Link>
            </Button>
          }
        />
      </>
    );
  }

  const stats = getDashboardStats(user, requests);

  const relevant = requests.filter((request) =>
    REVIEW_QUEUE_STATUSES.some((item) => item === request.status),
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = relevant.filter((request) => {
    const queryMatch =
      !normalizedQuery ||
      request.requestNumber.toLowerCase().includes(normalizedQuery) ||
      request.title.toLowerCase().includes(normalizedQuery);

    const statusMatch = status === "ALL" || request.status === status;

    const unitMatch = businessUnitId === "ALL" || request.businessUnitId === businessUnitId;

    const requestDate = request.updatedAt.slice(0, 10);

    const fromMatch = !dateFrom || requestDate >= dateFrom;

    const toMatch = !dateTo || requestDate <= dateTo;

    return queryMatch && statusMatch && unitMatch && fromMatch && toMatch;
  });

  const actionable = filtered.filter(
    (request) => request.status === "SUBMITTED" || request.status === "UNDER_REVIEW",
  );

  const revisionWaiting = filtered.filter((request) => request.status === "REVISION_REQUIRED");

  const resetFilters = () => {
    setQuery("");
    setStatus("ALL");
    setBusinessUnitId("ALL");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <>
      <PageHeader
        title="Antrean Review"
        description="Tinjau pengajuan keuangan dari seluruh unit bisnis."
        actions={
          <Button asChild variant="outline">
            <Link to="/riwayat-review">
              <History className="size-4" aria-hidden />
              Riwayat Review
            </Link>
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Filter Antrean</h2>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[1.4fr_180px_220px_160px_160px_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nomor atau judul"
          />

          <Select value={status} onValueChange={(value) => setStatus(value as QueueStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {QUEUE_STATUS_OPTIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item === "ALL" ? "Semua Status" : STATUS_LABELS[item as RequestStatus]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={businessUnitId} onValueChange={setBusinessUnitId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">Semua Unit Bisnis</SelectItem>

              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            aria-label="Tanggal mulai"
          />

          <Input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            aria-label="Tanggal akhir"
          />

          <Button type="button" variant="outline" onClick={resetFilters}>
            <RotateCcw className="size-4" aria-hidden />
            Reset
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Perlu Ditindaklanjuti</h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Pengajuan baru dan pengajuan yang sedang direview.
          </p>
        </div>

        <RequestTable
          requests={actionable}
          showRequester
          emptyTitle="Tidak ada antrean aktif"
          emptyDescription="Tidak ada pengajuan yang sedang menunggu tindakan Finance Reviewer."
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Menunggu Revisi Unit</h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Finance menunggu Unit Bisnis memperbaiki dan mengajukan ulang.
          </p>
        </div>

        <RequestTable
          requests={revisionWaiting}
          showRequester
          emptyTitle="Tidak ada pengajuan dalam revisi"
          emptyDescription="Pengajuan yang memerlukan revisi akan tampil di sini."
        />
      </section>
    </>
  );
}
