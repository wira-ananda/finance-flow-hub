import { useNavigate } from "@tanstack/react-router";
import { Banknote } from "lucide-react";
import { useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PaymentDialog } from "@/components/requests/PaymentDialog";
import { RequestTable } from "@/components/requests/RequestTable";
import { Button } from "@/components/ui/button";
import { useRequests } from "@/hooks/use-requests";
import { formatRupiah, formatTanggal } from "@/lib/formatters";
import { useSession } from "@/providers/session-provider";
import { processPayment, type ProcessPaymentInput } from "@/services/payment.service";
import { getBusinessUnitName, getDashboardStats, getUserName } from "@/services/request.service";
import type { FinanceRequest } from "@/types";

export function PaymentQueuePage() {
  const navigate = useNavigate();

  const { user } = useSession();

  const requests = useRequests(user);

  const [selectedRequest, setSelectedRequest] = useState<FinanceRequest | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  if (user.role !== "FINANCE_PAYMENT") {
    return (
      <>
        <PageHeader title="Proses Pembayaran" />

        <EmptyState
          title="Akses tidak tersedia"
          description="Halaman ini hanya tersedia untuk Finance Payment."
        />
      </>
    );
  }

  const ready = requests.filter((request) => request.status === "APPROVED");

  const paid = requests.filter((request) => request.status === "PAID");

  const stats = getDashboardStats(user, requests);

  const columns: DataTableColumn<FinanceRequest>[] = [
    {
      key: "request",
      header: "Pengajuan",
      render: (row) => (
        <div>
          <p className="num text-xs font-medium text-primary">{row.requestNumber}</p>

          <p className="mt-0.5 max-w-[300px] truncate text-sm font-medium text-foreground">
            {row.title}
          </p>
        </div>
      ),
    },
    {
      key: "unit",
      header: "Unit Bisnis",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {getBusinessUnitName(row.businessUnitId)}
        </span>
      ),
    },
    {
      key: "requester",
      header: "Pemohon",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{getUserName(row.requesterId)}</span>
      ),
    },
    {
      key: "amount",
      header: "Nominal",
      align: "right",
      render: (row) => (
        <span className="num whitespace-nowrap font-medium">{formatRupiah(row.amount)}</span>
      ),
    },
    {
      key: "needed",
      header: "Dibutuhkan",
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatTanggal(row.neededAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "action",
      header: "Aksi",
      align: "right",
      render: (row) => (
        <Button
          type="button"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();

            setActionError(null);

            setSelectedRequest(row);
          }}
        >
          <Banknote className="size-3.5" aria-hidden />
          Proses
        </Button>
      ),
    },
  ];

  const handlePayment = (input: ProcessPaymentInput): boolean => {
    if (!selectedRequest) {
      return false;
    }

    try {
      processPayment(user, selectedRequest.id, input);

      setSelectedRequest(null);

      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Pembayaran gagal diproses.");

      return false;
    }
  };

  return (
    <>
      <PageHeader
        title="Proses Pembayaran"
        description="Pengajuan yang telah disetujui dan siap diproses pembayarannya."
      />

      {actionError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Siap Dibayar</h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Pengajuan yang sudah disetujui Finance Reviewer.
          </p>
        </div>

        <DataTable
          columns={columns}
          rows={ready}
          rowKey={(row) => row.id}
          onRowClick={(row) =>
            navigate({
              to: "/pengajuan/$id",
              params: {
                id: row.id,
              },
            })
          }
          emptyTitle="Tidak ada pembayaran tertunda"
          emptyDescription="Pengajuan yang disetujui reviewer akan tampil di sini."
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Riwayat Pembayaran</h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Pengajuan yang sudah selesai dibayarkan.
          </p>
        </div>

        <RequestTable
          requests={paid}
          showRequester
          emptyTitle="Belum ada pembayaran"
          emptyDescription="Riwayat pembayaran akan tampil di sini."
        />
      </section>

      {selectedRequest ? (
        <PaymentDialog
          key={selectedRequest.id}
          open
          request={selectedRequest}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedRequest(null);
            }
          }}
          onConfirm={handlePayment}
        />
      ) : null}
    </>
  );
}
