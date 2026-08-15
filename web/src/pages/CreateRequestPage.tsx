import { Link } from "@tanstack/react-router";

import { EmptyState } from "@/components/common/EmptyState";

import { ErrorState } from "@/components/common/ErrorState";

import { LoadingState } from "@/components/common/LoadingState";

import { PageHeader } from "@/components/common/PageHeader";

import { RequestForm } from "@/components/requests/form/RequestForm";

import { Button } from "@/components/ui/button";

import { useRequestQuery } from "@/hooks/use-requests";

import { canPerform } from "@/lib/permissions";

import { useSession } from "@/providers/session-provider";

interface CreateRequestPageProps {
  editRequestId: string | null;
}

export function CreateRequestPage({ editRequestId }: CreateRequestPageProps) {
  const { user } = useSession();

  const requestQuery = useRequestQuery(user, editRequestId);

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

  if (editRequestId && requestQuery.isPending) {
    return (
      <>
        <PageHeader title="Ubah Pengajuan" />

        <LoadingState rows={7} />
      </>
    );
  }

  if (editRequestId && requestQuery.isError) {
    return (
      <>
        <PageHeader title="Ubah Pengajuan" />

        <ErrorState
          title="Pengajuan gagal dimuat"
          description={requestQuery.error.message}
          onRetry={() => {
            void requestQuery.refetch();
          }}
        />
      </>
    );
  }

  const requestToEdit = editRequestId ? requestQuery.data : undefined;

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
      {...(requestToEdit
        ? {
            initialRequest: requestToEdit,
          }
        : {})}
    />
  );
}
