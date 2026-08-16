import { useState } from "react";

import { Plus } from "lucide-react";

import { UserDialog } from "@/components/admin/UserDialog";

import { UserManagementTable } from "@/components/admin/UserManagementTable";

import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

import { EmptyState } from "@/components/common/EmptyState";

import { ErrorState } from "@/components/common/ErrorState";

import { LoadingState } from "@/components/common/LoadingState";

import { PageHeader } from "@/components/common/PageHeader";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { useBusinessUnitsQuery } from "@/hooks/use-business-units";

import { useUserMutation, useUsersQuery } from "@/hooks/use-users";

import { useSession } from "@/providers/session-provider";

import type { UserInput } from "@/services/user.service";

import type { User } from "@/types";

export function UserManagementPage() {
  const { user: currentUser } = useSession();

  const usersQuery = useUsersQuery();

  const unitsQuery = useBusinessUnitsQuery();

  const userMutation = useUserMutation(currentUser);

  const [query, setQuery] = useState("");

  const [userDialogOpen, setUserDialogOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [statusTarget, setStatusTarget] = useState<User | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

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

  const users = usersQuery.data ?? [];

  const units = unitsQuery.data ?? [];

  const normalizedQuery = query.trim().toLowerCase();

  const filteredUsers = normalizedQuery
    ? users.filter(
        (user) =>
          user.name.toLowerCase().includes(normalizedQuery) ||
          user.email.toLowerCase().includes(normalizedQuery) ||
          user.jobTitle.toLowerCase().includes(normalizedQuery),
      )
    : users;

  const handleCreate = () => {
    setActionError(null);

    setEditingUser(null);

    setUserDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setActionError(null);

    setEditingUser(user);

    setUserDialogOpen(true);
  };

  const handleSubmitUser = async (input: UserInput): Promise<boolean> => {
    if (userMutation.isPending) {
      return false;
    }

    setActionError(null);

    try {
      if (editingUser) {
        await userMutation.mutateAsync({
          type: "UPDATE",

          userId: editingUser.id,

          input,
        });
      } else {
        await userMutation.mutateAsync({
          type: "CREATE",

          input,
        });
      }

      return true;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Pengguna gagal disimpan.");
    }
  };

  const handleConfirmStatus = async (): Promise<boolean> => {
    if (!statusTarget || userMutation.isPending) {
      return false;
    }

    setActionError(null);

    try {
      await userMutation.mutateAsync({
        type: "SET_ACTIVE",

        userId: statusTarget.id,

        isActive: !statusTarget.active,
      });

      setStatusTarget(null);

      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Status pengguna gagal diperbarui.");

      return false;
    }
  };

  return (
    <>
      <PageHeader
        title="Kelola Pengguna"
        description="Kelola Google Account yang diizinkan masuk, role, Unit Bisnis, jabatan, dan status akses."
        actions={
          <Button type="button" disabled={userMutation.isPending} onClick={handleCreate}>
            <Plus className="size-4" aria-hidden />
            Tambah Pengguna
          </Button>
        }
      />

      {actionError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {actionError}
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-background-subtle px-4 py-3 text-sm text-muted-foreground">
        Sistem tidak menyimpan password. Pengguna hanya dapat masuk jika email yang didaftarkan sama
        dengan Google Account yang berhasil diverifikasi saat login. Menonaktifkan pengguna akan
        memblokir akses API tanpa menghapus histori pengajuan.
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cari nama, email, atau jabatan pengguna"
        className="max-w-md"
      />

      <UserManagementTable
        users={filteredUsers}
        units={units}
        currentUserId={currentUser.id}
        disabled={userMutation.isPending}
        onEdit={handleEdit}
        onToggleActive={(selectedUser) => {
          setActionError(null);

          setStatusTarget(selectedUser);
        }}
      />

      {userDialogOpen ? (
        <UserDialog
          key={editingUser?.id ?? "new-user"}
          open
          user={editingUser ?? undefined}
          currentUserId={currentUser.id}
          units={units}
          onOpenChange={(open) => {
            setUserDialogOpen(open);

            if (!open) {
              setEditingUser(null);
            }
          }}
          onSubmit={handleSubmitUser}
        />
      ) : null}

      <ConfirmationDialog
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open && !userMutation.isPending) {
            setStatusTarget(null);
          }
        }}
        title={statusTarget?.active ? "Nonaktifkan Pengguna" : "Aktifkan Pengguna"}
        description={
          statusTarget?.active
            ? `${statusTarget.name} tidak akan dapat menggunakan Finance Request setelah dinonaktifkan. Histori pengajuan tetap tersimpan.`
            : `${statusTarget?.name ?? "Pengguna ini"} akan kembali dapat masuk menggunakan Google Account yang terdaftar.`
        }
        confirmLabel={statusTarget?.active ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
        destructive={Boolean(statusTarget?.active)}
        onConfirm={handleConfirmStatus}
      />
    </>
  );
}
