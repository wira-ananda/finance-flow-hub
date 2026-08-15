import { Link } from "@tanstack/react-router";

import { ArrowLeft, Pencil } from "lucide-react";

import { ActivityTimeline } from "@/components/common/ActivityTimeline";

import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

import { EmptyState } from "@/components/common/EmptyState";

import { ErrorState } from "@/components/common/ErrorState";

import { LoadingState } from "@/components/common/LoadingState";

import { PageHeader } from "@/components/common/PageHeader";

import { StatusBadge } from "@/components/common/StatusBadge";

import {
  BeneficiaryInformationSection,
  PaymentInformationSection,
  RequestDocumentsSection,
  RequestInformationSection,
  RequestStatusAlert,
} from "@/components/requests/detail/RequestDetailSections";

import { Button } from "@/components/ui/button";

import { useBusinessUnits } from "@/hooks/use-business-units";

import { useRequestQuery } from "@/hooks/use-requests";

import { useRequestDetailActions } from "@/hooks/use-request-detail-actions";

import { ACTION_LABELS, availableActions } from "@/lib/permissions";

import { useSession } from "@/providers/session-provider";

import { getBusinessUnitName } from "@/services/request.service";

import type { RequestAction } from "@/lib/permissions";

import type { UserRole } from "@/types";

type BackRoute = "/" | "/pengajuan" | "/review" | "/pembayaran";

const STEP_7D_REMOTE_ACTIONS = new Set<RequestAction>(["EDIT", "SUBMIT"]);

function getBackRoute(role: UserRole): BackRoute {
  switch (role) {
    case "UNIT_USER":
      return "/pengajuan";

    case "FINANCE_REVIEWER":
      return "/review";

    case "FINANCE_PAYMENT":
      return "/pembayaran";

    case "ADMIN":
      return "/";
  }
}

export function RequestDetailPage({ id }: { id: string }) {
  const { user } = useSession();

  const units = useBusinessUnits();

  const requestQuery = useRequestQuery(user, id);

  const request = requestQuery.data;

  const actions = useRequestDetailActions({
    user,
    request,
  });

  if (!user) {
    return null;
  }

  if (requestQuery.isPending) {
    return (
      <>
        <PageHeader title="Detail Pengajuan" />

        <LoadingState rows={8} />
      </>
    );
  }

  if (requestQuery.isError) {
    return (
      <>
        <PageHeader title="Detail Pengajuan" />

        <ErrorState
          title="Detail pengajuan gagal dimuat"
          description={requestQuery.error.message}
          onRetry={() => {
            void requestQuery.refetch();
          }}
        />
      </>
    );
  }

  if (!request) {
    return (
      <>
        <PageHeader title="Detail Pengajuan" />

        <EmptyState
          title="Pengajuan tidak ditemukan"
          description="Pengajuan tidak tersedia atau tidak dapat diakses dengan role Anda saat ini."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={getBackRoute(user.role)}>
                <ArrowLeft className="size-4" aria-hidden />
                Kembali
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  const availableRequestActions = availableActions(user, request).filter((action) =>
    STEP_7D_REMOTE_ACTIONS.has(action),
  );

  const supportingDocuments = request.documents.filter((document) => document.type === "LAMPIRAN");

  const officialDocuments = request.documents.filter((document) => document.type !== "LAMPIRAN");

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to={getBackRoute(user.role)}>
          <ArrowLeft className="size-4" aria-hidden />
          Kembali
        </Link>
      </Button>

      <PageHeader
        title={request.title}
        description={`${request.requestNumber} · ${getBusinessUnitName(
          request.businessUnitId,
          units,
        )}`}
        actions={
          <>
            <StatusBadge status={request.status} className="px-2.5 py-1 text-sm" />

            {availableRequestActions.map((action) => (
              <Button
                key={action}
                type="button"
                size="sm"
                disabled={actions.isProcessing}
                variant="outline"
                className={
                  action === "SUBMIT"
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                    : ""
                }
                onClick={() => actions.handleAction(action)}
              >
                {action === "EDIT" ? <Pencil className="size-3.5" aria-hidden /> : null}

                {ACTION_LABELS[action]}
              </Button>
            ))}
          </>
        }
      />

      {user.role !== "UNIT_USER" ? (
        <div className="rounded-lg border border-border bg-background-subtle px-4 py-3 text-sm text-muted-foreground">
          Data detail sudah berasal dari backend. Aksi review dan pembayaran akan dihubungkan pada
          Step 7E–7G agar tidak menjalankan mutation mock terhadap data produksi.
        </div>
      ) : null}

      {actions.actionError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {actions.actionError}
        </div>
      ) : null}

      <RequestStatusAlert request={request} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <RequestInformationSection request={request} />

          <BeneficiaryInformationSection request={request} />

          <PaymentInformationSection request={request} />

          <RequestDocumentsSection
            title="Dokumen Pendukung"
            documents={supportingDocuments}
            emptyDescription="Belum ada dokumen pendukung."
          />

          <RequestDocumentsSection
            title="Surat Persetujuan & Bukti Transfer"
            documents={officialDocuments}
            emptyDescription="Dokumen resmi akan tersedia setelah pengajuan disetujui dan dibayarkan."
            showDocumentType
            highlight
          />
        </div>

        <section className="h-fit rounded-lg border border-border bg-card p-4 shadow-card">
          <h2 className="text-sm font-semibold text-foreground">Riwayat Aktivitas</h2>

          <div className="mt-4">
            <ActivityTimeline entries={request.activities} />
          </div>
        </section>
      </div>

      <ConfirmationDialog
        open={actions.pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            actions.setPendingAction(null);
          }
        }}
        title={actions.pendingAction ? ACTION_LABELS[actions.pendingAction] : ""}
        description={
          actions.pendingAction ? actions.getActionDescription(actions.pendingAction) : ""
        }
        confirmLabel={
          actions.pendingAction === "SUBMIT"
            ? request.status === "REVISION_REQUIRED"
              ? "Ya, Ajukan Ulang"
              : "Ya, Ajukan"
            : "Konfirmasi"
        }
        onConfirm={actions.handleConfirmAction}
      />
    </>
  );
}
