import { Pencil, Plus, Power, PowerOff } from "lucide-react";
import { useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { UserDialog } from "@/components/admin/UserDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS } from "@/constants/status";
import { useBusinessUnits } from "@/hooks/use-business-units";
import { useUsers } from "@/hooks/use-users";
import { useSession } from "@/providers/session-provider";
import { createUser, setUserActive, updateUser, type UserInput } from "@/services/user.service";
import type { User } from "@/types";

export function UserManagementPage() {
  const { user: currentUser } = useSession();

  const users = useUsers();

  const units = useBusinessUnits();

  const [query, setQuery] = useState("");

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const [pendingStatusUser, setPendingStatusUser] = useState<User | null>(null);

  const [pageError, setPageError] = useState<string | null>(null);

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

  const getUnitName = (businessUnitId: string | null) =>
    units.find((unit) => unit.id === businessUnitId)?.name ?? "Seluruh Unit";

  const handleSave = (input: UserInput, target?: User): boolean => {
    setPageError(null);

    try {
      if (target) {
        updateUser(currentUser, target.id, input);
      } else {
        createUser(currentUser, input);
      }

      return true;
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Gagal menyimpan pengguna.");

      return false;
    }
  };

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
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditingUser(row)}>
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={row.id === currentUser.id}
            onClick={() => setPendingStatusUser(row)}
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
        description="Kelola pengguna, role, unit bisnis, dan status akses."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Tambah Pengguna
          </Button>
        }
      />

      {pageError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {pageError}
        </div>
      ) : null}

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

      {createOpen ? (
        <UserDialog
          key="create-user"
          open
          units={units}
          onOpenChange={setCreateOpen}
          onSubmit={(input) => handleSave(input)}
        />
      ) : null}

      {editingUser ? (
        <UserDialog
          key={editingUser.id}
          open
          user={editingUser}
          units={units}
          onOpenChange={(open) => {
            if (!open) {
              setEditingUser(null);
            }
          }}
          onSubmit={(input) => handleSave(input, editingUser)}
        />
      ) : null}

      <ConfirmationDialog
        open={pendingStatusUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingStatusUser(null);
          }
        }}
        title={pendingStatusUser?.active ? "Nonaktifkan Pengguna" : "Aktifkan Pengguna"}
        description={
          pendingStatusUser?.active
            ? "Pengguna tidak dapat menggunakan akun ini selama statusnya nonaktif."
            : "Pengguna akan kembali mendapatkan akses sesuai role-nya."
        }
        confirmLabel={pendingStatusUser?.active ? "Nonaktifkan" : "Aktifkan"}
        destructive={pendingStatusUser?.active}
        onConfirm={() => {
          if (!pendingStatusUser) {
            return;
          }

          setPageError(null);

          try {
            setUserActive(currentUser, pendingStatusUser.id, !pendingStatusUser.active);

            setPendingStatusUser(null);
          } catch (error) {
            setPageError(
              error instanceof Error ? error.message : "Gagal mengubah status pengguna.",
            );
          }
        }}
      />
    </>
  );
}
