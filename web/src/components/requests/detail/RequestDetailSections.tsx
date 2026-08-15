import { AlertTriangle, Download, FileText } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";

import { Button } from "@/components/ui/button";

import { CATEGORY_LABELS, DOCUMENT_TYPE_LABELS } from "@/constants/status";

import { useBusinessUnits } from "@/hooks/use-business-units";

import { useUsers } from "@/hooks/use-users";

import {
  formatRupiah,
  formatTanggal,
  formatTanggalWaktu,
  formatUkuranFile,
} from "@/lib/formatters";

import {
  getBusinessUnitName,
  getLatestActivityNote,
  getLatestSubmittedAt,
  getUserName,
} from "@/services/request.service";

import type { FinanceRequest, RequestDocument } from "@/types";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>

      <span className="max-w-[60%] text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function RequestStatusAlert({ request }: { request: FinanceRequest }) {
  if (request.status === "REVISION_REQUIRED") {
    const note =
      getLatestActivityNote(request, "REVISION_REQUESTED") ??
      "Finance meminta pengajuan ini diperbaiki sebelum diajukan kembali.";

    return (
      <div className="flex gap-3 rounded-lg border border-status-revision/30 bg-status-revision/10 p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-revision" aria-hidden />

        <div>
          <p className="text-sm font-semibold text-foreground">Perlu Revisi</p>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">{note}</p>
        </div>
      </div>
    );
  }

  if (request.status === "REJECTED") {
    const reason =
      getLatestActivityNote(request, "REJECTED") ?? "Pengajuan ini telah ditolak oleh Finance.";

    return (
      <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />

        <div>
          <p className="text-sm font-semibold text-foreground">Pengajuan Ditolak</p>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">{reason}</p>
        </div>
      </div>
    );
  }

  return null;
}

export function RequestInformationSection({ request }: { request: FinanceRequest }) {
  const users = useUsers();

  const units = useBusinessUnits();

  const submittedAt = getLatestSubmittedAt(request);

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">Informasi Pengajuan</h2>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">{request.description}</p>

      <div className="mt-3">
        <InfoRow label="Kategori" value={CATEGORY_LABELS[request.category]} />

        <InfoRow label="Nominal" value={formatRupiah(request.amount)} />

        <InfoRow label="Pemohon" value={getUserName(request.requesterId, users)} />

        <InfoRow label="Unit Bisnis" value={getBusinessUnitName(request.businessUnitId, units)} />

        <InfoRow label="Dibutuhkan Tanggal" value={formatTanggal(request.neededAt)} />

        <InfoRow label="Dibuat" value={formatTanggal(request.createdAt)} />

        <InfoRow
          label="Tanggal Diajukan"
          value={submittedAt ? formatTanggal(submittedAt) : "Belum diajukan"}
        />

        <InfoRow
          label="Tanggal Pembayaran"
          value={request.paidAt ? formatTanggal(request.paidAt) : "Belum dibayar"}
        />
      </div>
    </section>
  );
}

export function BeneficiaryInformationSection({ request }: { request: FinanceRequest }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">Informasi Penerima</h2>

      <div className="mt-2">
        <InfoRow label="Nama Penerima" value={request.beneficiaryName} />

        <InfoRow label="Bank" value={request.beneficiaryBank} />

        <InfoRow label="Nomor Rekening" value={request.beneficiaryAccount} />
      </div>
    </section>
  );
}

export function PaymentInformationSection({ request }: { request: FinanceRequest }) {
  const users = useUsers();

  if (!request.payment) {
    return null;
  }

  return (
    <section className="rounded-lg border border-status-paid/25 bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Informasi Pembayaran</h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Detail transaksi pembayaran yang telah diproses Finance.
          </p>
        </div>

        <StatusBadge status="PAID" />
      </div>

      <div className="mt-3">
        <InfoRow label="Nominal Pembayaran" value={formatRupiah(request.payment.amount)} />

        <InfoRow
          label="Tanggal Pembayaran"
          value={formatTanggal(`${request.payment.paymentDate}T00:00:00Z`)}
        />

        <InfoRow label="Nomor Referensi" value={request.payment.referenceNumber} />

        <InfoRow label="Diproses Oleh" value={getUserName(request.payment.processedBy, users)} />

        <InfoRow label="Waktu Diproses" value={formatTanggalWaktu(request.payment.processedAt)} />
      </div>
    </section>
  );
}

interface RequestDocumentsSectionProps {
  title: string;

  documents: RequestDocument[];

  emptyDescription: string;

  showDocumentType?: boolean;

  highlight?: boolean;
}

export function RequestDocumentsSection({
  title,
  documents,
  emptyDescription,
  showDocumentType = false,
  highlight = false,
}: RequestDocumentsSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>

      {documents.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center gap-3 py-3">
              <span
                className={
                  highlight
                    ? "flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10"
                    : "flex size-8 shrink-0 items-center justify-center rounded-md bg-background-subtle"
                }
              >
                <FileText
                  className={highlight ? "size-4 text-primary" : "size-4 text-muted-foreground"}
                  aria-hidden
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {document.name}
                </span>

                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {showDocumentType ? `${DOCUMENT_TYPE_LABELS[document.type]} · ` : ""}

                  {document.documentNumber ? `${document.documentNumber} · ` : ""}

                  {formatUkuranFile(document.sizeKb)}
                </span>

                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {document.uploadedBy} · {formatTanggal(document.uploadedAt)}
                </span>
              </span>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled
                title="Unduh akan aktif setelah integrasi Google Drive."
                className="text-muted-foreground"
              >
                <Download className="size-3.5" aria-hidden />
                Unduh
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
