import { Pencil, Plus, Power, PowerOff } from "lucide-react";

import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";

import { EmptyState } from "@/components/common/EmptyState";

import { ErrorState } from "@/components/common/ErrorState";

import { LoadingState } from "@/components/common/LoadingState";

import { PageHeader } from "@/components/common/PageHeader";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { ROLE_LABELS } from "@/constants/status";

import { useBusinessUnitsQuery } from "@/hooks/use-business-units";

import { useUsersQuery } from "@/hooks/use-users";

import { useSession } from "@/providers/session-provider";

import type { User } from "@/types";

export function UserManagementPage() {
  const { user: currentUser } = useSession();

  const usersQuery = useUsersQuery();

  const unitsQuery = useBusinessUnitsQuery();

  const [query, setQuery] = useState("");

  const users = usersQuery.data ?? [];

  const units = unitsQuery.data ?? [];

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return users;
    }

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized),
    );
  }, [users, query]);

  if (!currentUser) {
    return null;
  }

  if (currentUser.role !== "ADMIN") {
    return (
      <>
        <PageHeader title="Kelola Pengguna" />

        <EmptyState
          title="Akses tidak tersedia"
          description="Halaman ini hanya tersedia untuk Administrator."
        />
      </>
    );
  }

  if (usersQuery.isPending || unitsQuery.isPending) {
    return (
      <>
        <PageHeader
          title="Kelola Pengguna"
          description="Data pengguna dibaca langsung dari Finance API."
        />

        <LoadingState rows={6} />
      </>
    );
  }

  const loadError = usersQuery.error ?? unitsQuery.error;

  if (loadError) {
    return (
      <>
        <PageHeader title="Kelola Pengguna" />

        <ErrorState
          title="Pengguna gagal dimuat"
          description={loadError.message}
          onRetry={() => {
            void Promise.all([usersQuery.refetch(), unitsQuery.refetch()]);
          }}
        />
      </>
    );
  }

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
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled
            title="Endpoint perubahan pengguna belum tersedia di backend."
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled
            title="Endpoint perubahan status pengguna belum tersedia di backend."
          >
            {row.active ? (
              <PowerOff className="size-3.5" aria-hidden />
            ) : (
              <Power className="size-3.5" aria-hidden />
            )}

            {row.active ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Kelola Pengguna"
        description="Data pengguna, role, unit bisnis, dan status akses dari backend."
        actions={
          <Button
            type="button"
            disabled
            title="Endpoint tambah pengguna belum tersedia di backend."
          >
            <Plus className="size-4" aria-hidden />
            Tambah Pengguna
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-background-subtle px-4 py-3 text-sm text-muted-foreground">
        Penambahan, perubahan, dan aktivasi pengguna belum dihubungkan karena Web API saat ini baru
        menyediakan endpoint baca untuk master pengguna.
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cari nama atau email pengguna"
        className="max-w-md"
      />

      <DataTable
        columns={columns}
        rows={filteredUsers}
        rowKey={(row) => row.id}
        emptyTitle="Tidak ada pengguna"
        emptyDescription="Pengguna yang sesuai pencarian akan tampil di sini."
      />
    </>
  );
}
