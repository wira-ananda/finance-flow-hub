import { useNavigate } from "@tanstack/react-router";

import { Banknote } from "lucide-react";
import { useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PaymentDialog } from "@/components/requests/PaymentDialog";
import { RequestTable } from "@/components/requests/RequestTable";
import { Button } from "@/components/ui/button";
import { useBusinessUnits } from "@/hooks/use-business-units";
import { usePaymentMutation } from "@/hooks/use-payment-actions";
import { useRequestsQuery } from "@/hooks/use-requests";
import { useUsers } from "@/hooks/use-users";
import { formatRupiah, formatTanggal } from "@/lib/formatters";
import { useSession } from "@/providers/session-provider";
import { getBusinessUnitName, getDashboardStats, getUserName } from "@/services/request.service";

import type { ProcessPaymentInput } from "@/services/payment.service";
import type { FinanceRequest } from "@/types";

export function PaymentQueuePage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const requestsQuery = useRequestsQuery(user);
  const paymentMutation = usePaymentMutation(user);
  const users = useUsers();
  const units = useBusinessUnits();

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

  if (requestsQuery.isPending) {
    return (
      <>
        <PageHeader title="Proses Pembayaran" />
        <LoadingState rows={7} />
      </>
    );
  }

  if (requestsQuery.isError) {
    return (
      <>
        <PageHeader title="Proses Pembayaran" />

        <ErrorState
          title="Antrean pembayaran gagal dimuat"
          description={requestsQuery.error.message}
          onRetry={() => {
            void requestsQuery.refetch();
          }}
        />
      </>
    );
  }

  const requests = requestsQuery.data ?? [];
  const ready = requests.filter((request) => request.status === "APPROVED");
  const paid = requests.filter((request) => request.status === "PAID");
  const stats = getDashboardStats(user, requests);

  const handlePayment = async (input: ProcessPaymentInput): Promise<boolean> => {
    if (!selectedRequest || paymentMutation.isPending) {
      return false;
    }

    setActionError(null);

    try {
      await paymentMutation.mutateAsync({
        requestId: selectedRequest.id,
        input,
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pembayaran gagal diproses.";

      setActionError(message);
      throw new Error(message);
    }
  };

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
          {getBusinessUnitName(row.businessUnitId, units)}
        </span>
      ),
    },
    {
      key: "requester",
      header: "Pemohon",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{getUserName(row.requesterId, users)}</span>
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
          disabled={paymentMutation.isPending}
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
            if (!open && !paymentMutation.isPending) {
              setSelectedRequest(null);
            }
          }}
          onConfirm={handlePayment}
        />
      ) : null}
    </>
  );
}
