import { Link } from "@tanstack/react-router";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useState } from "react";

import { ActivityTimeline } from "@/components/common/ActivityTimeline";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, DOCUMENT_TYPE_LABELS } from "@/constants/status";
import { formatRupiah, formatTanggal, formatUkuranFile } from "@/lib/formatters";
import { ACTION_LABELS, availableActions, type RequestAction } from "@/lib/permissions";
import { useSession } from "@/providers/session-provider";
import { getBusinessUnitName, getRequest, getUserName } from "@/services/request.service";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function RequestDetailPage({ id }: { id: string }) {
  const { user } = useSession();
  const request = getRequest(user, id);
  const [pendingAction, setPendingAction] = useState<RequestAction | null>(null);

  if (!request) {
    return (
      <>
        <PageHeader title="Detail Pengajuan" />
        <EmptyState
          title="Pengajuan tidak ditemukan"
          description="Pengajuan tidak tersedia atau tidak dapat diakses dengan role Anda saat ini."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/pengajuan">Kembali ke daftar</Link>
            </Button>
          }
        />
      </>
    );
  }

  const actions = availableActions(user, request);
  const supporting = request.documents.filter((doc) => doc.type === "LAMPIRAN");
  const official = request.documents.filter((doc) => doc.type !== "LAMPIRAN");

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to="/pengajuan">
          <ArrowLeft className="size-4" aria-hidden />
          Kembali
        </Link>
      </Button>

      <PageHeader
        title={request.title}
        description={`${request.requestNumber} · ${getBusinessUnitName(request.businessUnitId)}`}
        actions={
          <>
            <StatusBadge status={request.status} className="px-2.5 py-1 text-sm" />
            {actions.map((action) => (
              <Button
                key={action}
                size="sm"
                variant={action === "REJECT" ? "destructive" : "outline"}
                className={
                  action === "APPROVE" || action === "PROCESS_PAYMENT" || action === "SUBMIT"
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                    : ""
                }
                onClick={() => setPendingAction(action)}
              >
                {ACTION_LABELS[action]}
              </Button>
            ))}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Informasi Pengajuan</h2>
            <p className="mt-2 text-sm text-muted-foreground">{request.description}</p>
            <div className="mt-3">
              <InfoRow label="Kategori" value={CATEGORY_LABELS[request.category]} />
              <InfoRow label="Nominal" value={formatRupiah(request.amount)} />
              <InfoRow label="Pemohon" value={getUserName(request.requesterId)} />
              <InfoRow label="Unit Bisnis" value={getBusinessUnitName(request.businessUnitId)} />
              <InfoRow label="Dibutuhkan Tanggal" value={formatTanggal(request.neededAt)} />
              <InfoRow label="Dibuat" value={formatTanggal(request.createdAt)} />
              <InfoRow
                label="Tanggal Pembayaran"
                value={request.paidAt ? formatTanggal(request.paidAt) : "Belum dibayar"}
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Informasi Penerima</h2>
            <div className="mt-2">
              <InfoRow label="Nama Penerima" value={request.beneficiaryName} />
              <InfoRow label="Bank" value={request.beneficiaryBank} />
              <InfoRow label="Nomor Rekening" value={request.beneficiaryAccount} />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Dokumen Pendukung</h2>
            {supporting.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Belum ada dokumen pendukung.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {supporting.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-3 py-2.5">
                    <FileText className="size-4 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{doc.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatUkuranFile(doc.sizeKb)} · {doc.uploadedBy}
                      </span>
                    </span>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Download className="size-3.5" aria-hidden />
                      Unduh
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">
              Surat Persetujuan &amp; Bukti Transfer
            </h2>
            {official.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Dokumen resmi akan tersedia setelah pengajuan disetujui dan dibayarkan.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {official.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-3 py-2.5">
                    <FileText className="size-4 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{doc.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {DOCUMENT_TYPE_LABELS[doc.type]} · {formatUkuranFile(doc.sizeKb)}
                      </span>
                    </span>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Download className="size-3.5" aria-hidden />
                      Unduh
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-lg border border-border bg-card p-4 shadow-card lg:col-span-1">
          <h2 className="text-sm font-semibold text-foreground">Riwayat Aktivitas</h2>
          <div className="mt-4">
            <ActivityTimeline entries={request.activities} />
          </div>
        </section>
      </div>

      <ConfirmationDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction ? ACTION_LABELS[pendingAction] : ""}
        description="Aksi ini masih menggunakan data contoh. Alur kerja lengkap akan diaktifkan pada tahap pengembangan berikutnya."
        confirmLabel="Mengerti"
        destructive={pendingAction === "REJECT"}
        onConfirm={() => setPendingAction(null)}
      />
    </>
  );
}
