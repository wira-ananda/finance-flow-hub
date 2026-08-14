import { Link, useRouterState } from "@tanstack/react-router";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RequestForm } from "@/components/requests/form/RequestForm";
import { Button } from "@/components/ui/button";
import { useRequest } from "@/hooks/use-requests";
import { canPerform } from "@/lib/permissions";
import { useSession } from "@/providers/session-provider";

function getEditRequestId(search: unknown): string | null {
  if (typeof search !== "object" || search === null) {
    return null;
  }

  const edit = (search as Record<string, unknown>).edit;

  return typeof edit === "string" ? edit : null;
}

export function CreateRequestPage() {
  const { user } = useSession();

  const search = useRouterState({
    select: (state) => state.location.search,
  });

  const editRequestId = getEditRequestId(search);

  const requestToEdit = useRequest(user, editRequestId);

  if (!user) {
    return null;
  }

  if (user.role !== "UNIT_USER") {
    return (
      <>
        <PageHeader title="Buat Pengajuan" />

        <EmptyState
          title="Akses tidak tersedia"
          description="Hanya pengguna Unit Bisnis yang dapat membuat pengajuan."
          action={
            <Button asChild variant="outline">
              <Link to="/">Kembali ke Dashboard</Link>
            </Button>
          }
        />
      </>
    );
  }

  if (editRequestId && !requestToEdit) {
    return (
      <>
        <PageHeader title="Ubah Pengajuan" />

        <EmptyState
          title="Pengajuan tidak ditemukan"
          description="Pengajuan tidak tersedia atau tidak dapat Anda akses."
          action={
            <Button asChild variant="outline">
              <Link to="/pengajuan">Kembali ke Pengajuan Saya</Link>
            </Button>
          }
        />
      </>
    );
  }

  if (requestToEdit && !canPerform(user, requestToEdit, "EDIT")) {
    return (
      <>
        <PageHeader title="Ubah Pengajuan" />

        <EmptyState
          title="Pengajuan tidak dapat diubah"
          description="Hanya pengajuan dengan status Draf atau Perlu Revisi yang dapat diubah."
          action={
            <Button asChild variant="outline">
              <Link to="/pengajuan">Kembali ke Pengajuan Saya</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <RequestForm
      key={requestToEdit?.id ?? "new-request"}
      user={user}
      initialRequest={requestToEdit}
    />
  );
}
