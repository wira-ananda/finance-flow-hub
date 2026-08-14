import { Link } from "@tanstack/react-router";
import { ArrowLeft, Info } from "lucide-react";

import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { PageHeader } from "@/components/common/PageHeader";
import {
  AttachmentsSection,
  BeneficiarySection,
  RequestDetailsSection,
  RequestSummary,
} from "@/components/requests/form/RequestFormSections";
import { Button } from "@/components/ui/button";
import { useRequestForm } from "@/hooks/use-request-form";
import type { FinanceRequest, User } from "@/types";

interface RequestFormProps {
  user: User;
  initialRequest?: FinanceRequest;
}

export function RequestForm({ user, initialRequest }: RequestFormProps) {
  const form = useRequestForm(user, initialRequest);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to="/pengajuan">
          <ArrowLeft className="size-4" aria-hidden />
          Kembali
        </Link>
      </Button>

      <PageHeader
        title={form.isEditMode ? "Ubah Pengajuan Keuangan" : "Buat Pengajuan Keuangan"}
        description={
          form.isRevision
            ? "Perbaiki pengajuan sesuai catatan Finance, kemudian ajukan ulang."
            : "Lengkapi informasi pengajuan sebelum dikirim ke tim Finance untuk direview."
        }
      />

      {form.isRevision ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-status-revision/30 bg-status-revision/10 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-status-revision" aria-hidden />

          <div>
            <p className="text-sm font-medium text-foreground">Catatan Revisi Finance</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {form.revisionNote ??
                "Finance meminta pengajuan ini diperbaiki sebelum diajukan kembali."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-background-subtle p-3.5">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Selama tahap development, data dan metadata dokumen disimpan secara lokal di browser.
          </p>
        </div>
      )}

      {form.actionError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {form.actionError}
        </div>
      ) : null}

      <form
        className="grid gap-4 lg:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          form.handleOpenSubmit();
        }}
      >
        <div className="space-y-4 lg:col-span-2">
          <RequestDetailsSection
            values={form.values}
            errors={form.errors}
            setField={form.setField}
            disabled={form.isSaving}
          />

          <BeneficiarySection
            values={form.values}
            errors={form.errors}
            setField={form.setField}
            disabled={form.isSaving}
          />

          <AttachmentsSection
            values={form.values}
            setField={form.setField}
            disabled={form.isSaving}
          />
        </div>

        <RequestSummary
          requesterName={user.name}
          unitName={form.unit?.name ?? "-"}
          amount={form.numericAmount}
          attachmentCount={form.values.attachments.length}
          isRevision={form.isRevision}
          isEditMode={form.isEditMode}
          disabled={form.isSaving}
          onSaveDraft={form.handleSaveDraft}
        />
      </form>

      <ConfirmationDialog
        open={form.submitDialogOpen}
        onOpenChange={form.setSubmitDialogOpen}
        title={form.isRevision ? "Ajukan Ulang" : "Ajukan ke Finance"}
        description={
          form.isRevision
            ? "Pastikan semua perbaikan sudah sesuai catatan Finance. Pengajuan akan kembali masuk ke antrean review."
            : "Pastikan seluruh informasi sudah benar. Setelah diajukan, pengajuan tidak dapat diubah sebelum Finance meminta revisi."
        }
        confirmLabel={form.isRevision ? "Ya, Ajukan Ulang" : "Ya, Ajukan"}
        onConfirm={form.handleSubmit}
      />
    </>
  );
}
