import { useNavigate } from "@tanstack/react-router";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";

import { StatusBadge } from "@/components/common/StatusBadge";

import { CATEGORY_LABELS } from "@/constants/status";

import { useBusinessUnits } from "@/hooks/use-business-units";

import { useUsers } from "@/hooks/use-users";

import { formatRupiah, formatTanggal } from "@/lib/formatters";

import { getBusinessUnitName, getLatestSubmittedAt, getUserName } from "@/services/request.service";

import type { FinanceRequest } from "@/types";

interface RequestTableProps {
  requests: FinanceRequest[];

  showUnit?: boolean;

  showRequester?: boolean;

  emptyTitle?: string;

  emptyDescription?: string;
}

export function RequestTable({
  requests,
  showUnit = true,
  showRequester = false,
  emptyTitle,
  emptyDescription,
}: RequestTableProps) {
  const navigate = useNavigate();

  const users = useUsers();

  const units = useBusinessUnits();

  const columns: DataTableColumn<FinanceRequest>[] = [
    {
      key: "number",

      header: "Pengajuan",

      render: (row) => (
        <div className="min-w-0">
          <p className="num text-xs font-medium text-primary">{row.requestNumber}</p>

          <p className="mt-0.5 max-w-[280px] truncate text-sm font-medium text-foreground">
            {row.title}
          </p>
        </div>
      ),
    },

    ...(showUnit
      ? [
          {
            key: "unit",

            header: "Unit Bisnis",

            render: (row: FinanceRequest) => (
              <span className="text-sm text-muted-foreground">
                {getBusinessUnitName(row.businessUnitId, units)}
              </span>
            ),
          } satisfies DataTableColumn<FinanceRequest>,
        ]
      : []),

    ...(showRequester
      ? [
          {
            key: "requester",

            header: "Pemohon",

            render: (row: FinanceRequest) => (
              <span className="text-sm text-muted-foreground">
                {getUserName(row.requesterId, users)}
              </span>
            ),
          } satisfies DataTableColumn<FinanceRequest>,
        ]
      : []),

    {
      key: "category",

      header: "Kategori",

      render: (row) => (
        <span className="text-sm text-muted-foreground">{CATEGORY_LABELS[row.category]}</span>
      ),
    },

    {
      key: "amount",

      header: "Nominal",

      align: "right",

      render: (row) => (
        <span className="num whitespace-nowrap text-sm font-medium text-foreground">
          {formatRupiah(row.amount)}
        </span>
      ),
    },

    {
      key: "date",

      header: "Tanggal",

      render: (row) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatTanggal(getLatestSubmittedAt(row) ?? row.createdAt)}
        </span>
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
  ];

  return (
    <DataTable
      columns={columns}
      rows={requests}
      rowKey={(row) => row.id}
      onRowClick={(row) =>
        navigate({
          to: "/pengajuan/$id",

          params: {
            id: row.id,
          },
        })
      }
      emptyTitle={emptyTitle ?? "Belum ada pengajuan"}
      emptyDescription={
        emptyDescription ?? "Pengajuan yang sesuai dengan hak akses Anda akan tampil di sini."
      }
    />
  );
}
