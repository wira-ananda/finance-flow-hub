import { Link } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw } from "lucide-react";
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
import type { DashboardStat, RequestStatus } from "@/types";

const HISTORY_STATUSES = ["APPROVED", "REJECTED", "PAID"] as const;

type HistoryStatus = "ALL" | (typeof HISTORY_STATUSES)[number];

export function ReviewHistoryPage() {
  const { user } = useSession();

  const requests = useRequests(user);
  const units = useBusinessUnits();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<HistoryStatus>("ALL");
  const [businessUnitId, setBusinessUnitId] = useState("ALL");

  if (!user) {
    return null;
  }

  if (user.role !== "FINANCE_REVIEWER") {
    return (
      <>
        <PageHeader title="Riwayat Review" />

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

  const history = requests.filter((request) =>
    HISTORY_STATUSES.some((item) => item === request.status),
  );

  const approvedCount = history.filter(
    (request) => request.status === "APPROVED" || request.status === "PAID",
  ).length;

  const rejectedCount = history.filter((request) => request.status === "REJECTED").length;

  const paidCount = history.filter((request) => request.status === "PAID").length;

  const stats: DashboardStat[] = [
    {
      key: "total",
      label: "Total Keputusan",
      value: String(history.length),
      helper: "Pengajuan yang sudah diputuskan",
      tone: "primary",
    },
    {
      key: "approved",
      label: "Disetujui",
      value: String(approvedCount),
      helper: "Termasuk yang sudah dibayar",
      tone: "success",
    },
    {
      key: "rejected",
      label: "Ditolak",
      value: String(rejectedCount),
      helper: "Pengajuan tidak dilanjutkan",
      tone: "danger",
    },
    {
      key: "paid",
      label: "Sudah Dibayar",
      value: String(paidCount),
      helper: "Pengajuan selesai dibayarkan",
      tone: "success",
    },
  ];

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = history.filter((request) => {
    const queryMatch =
      !normalizedQuery ||
      request.title.toLowerCase().includes(normalizedQuery) ||
      request.requestNumber.toLowerCase().includes(normalizedQuery);

    const statusMatch = status === "ALL" || request.status === status;

    const unitMatch = businessUnitId === "ALL" || request.businessUnitId === businessUnitId;

    return queryMatch && statusMatch && unitMatch;
  });

  const resetFilters = () => {
    setQuery("");
    setStatus("ALL");
    setBusinessUnitId("ALL");
  };

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to="/review">
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke Antrean
        </Link>
      </Button>

      <PageHeader
        title="Riwayat Review"
        description="Pengajuan yang telah disetujui atau ditolak oleh Finance."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Filter Riwayat</h2>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_200px_240px_auto]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nomor atau judul"
          />

          <Select value={status} onValueChange={(value) => setStatus(value as HistoryStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>

              {HISTORY_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {STATUS_LABELS[item as RequestStatus]}
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

          <Button type="button" variant="outline" onClick={resetFilters}>
            <RotateCcw className="size-4" aria-hidden />
            Reset
          </Button>
        </div>
      </section>

      <RequestTable
        requests={filtered}
        showRequester
        emptyTitle="Belum ada riwayat review"
        emptyDescription="Pengajuan yang sudah diputuskan akan tampil di sini."
      />
    </>
  );
}
