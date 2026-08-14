import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { ROLE_LABELS } from "@/constants/status";
import { getBusinessUnitName } from "@/services/request.service";
import { listUsers } from "@/services/user.service";
import type { User } from "@/types";

const columns: DataTableColumn<User>[] = [
  {
    key: "name",
    header: "Nama",
    render: (row) => (
      <div>
        <p className="text-sm font-medium text-foreground">{row.name}</p>
        <p className="text-xs text-muted-foreground">{row.email}</p>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
    render: (row) => <span className="text-sm text-foreground">{ROLE_LABELS[row.role]}</span>,
  },
  {
    key: "unit",
    header: "Unit Bisnis",
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.businessUnitId ? getBusinessUnitName(row.businessUnitId) : "Seluruh Unit"}
      </span>
    ),
  },
  {
    key: "title",
    header: "Jabatan",
    render: (row) => <span className="text-sm text-muted-foreground">{row.jobTitle}</span>,
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
];

export function UserManagementPage() {
  return (
    <>
      <PageHeader
        title="Kelola Pengguna"
        description="Daftar pengguna beserta role dan unit bisnisnya (data contoh)."
      />
      <DataTable columns={columns} rows={listUsers()} rowKey={(row) => row.id} />
    </>
  );
}
