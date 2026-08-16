import { Pencil, Power, PowerOff } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";

import { Button } from "@/components/ui/button";

import { ROLE_LABELS } from "@/constants/status";

import type { BusinessUnit, User } from "@/types";

interface UserManagementTableProps {
  users: User[];

  units: BusinessUnit[];

  currentUserId: string;

  disabled?: boolean;

  onEdit: (user: User) => void;

  onToggleActive: (user: User) => void;
}

export function UserManagementTable({
  users,
  units,
  currentUserId,
  disabled = false,
  onEdit,
  onToggleActive,
}: UserManagementTableProps) {
  const getUnitName = (businessUnitId: string | null) =>
    units.find((unit) => unit.id === businessUnitId)?.name ?? "Seluruh Unit";

  const columns: DataTableColumn<User>[] = [
    {
      key: "name",

      header: "Nama",

      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>

          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },

    {
      key: "role",

      header: "Role",

      render: (row) => ROLE_LABELS[row.role],
    },

    {
      key: "unit",

      header: "Unit Bisnis",

      render: (row) => (
        <span className="text-muted-foreground">{getUnitName(row.businessUnitId)}</span>
      ),
    },

    {
      key: "title",

      header: "Jabatan",

      render: (row) => <span className="text-muted-foreground">{row.jobTitle}</span>,
    },

    {
      key: "status",

      header: "Status",

      render: (row) => (
        <span
          className={
            row.active
              ? "status-approved inline-flex rounded-md px-2 py-0.5 text-xs font-medium"
              : "status-draft inline-flex rounded-md px-2 py-0.5 text-xs font-medium"
          }
        >
          {row.active ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },

    {
      key: "actions",

      header: "Aksi",

      align: "right",

      render: (row) => {
        const isSelf = row.id === currentUserId;

        return (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onEdit(row)}
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isSelf}
              title={
                isSelf
                  ? "Administrator tidak dapat menonaktifkan akun yang sedang digunakan."
                  : undefined
              }
              onClick={() => onToggleActive(row)}
            >
              {row.active ? (
                <PowerOff className="size-3.5" aria-hidden />
              ) : (
                <Power className="size-3.5" aria-hidden />
              )}

              {row.active ? "Nonaktifkan" : "Aktifkan"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={users}
      rowKey={(row) => row.id}
      emptyTitle="Tidak ada pengguna"
      emptyDescription="Pengguna yang sesuai pencarian akan tampil di sini."
    />
  );
}
