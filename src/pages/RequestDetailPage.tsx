import {
  Link,
} from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileText,
  Pencil,
} from "lucide-react";
import {
  useState,
} from "react";

import { ActivityTimeline } from "@/components/common/ActivityTimeline";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/constants/status";
import { useRequest } from "@/hooks/use-requests";
import {
  formatRupiah,
  formatTanggal,
  formatUkuranFile,
} from "@/lib/formatters";
import {
  ACTION_LABELS,
  availableActions,
  type RequestAction,
} from "@/lib/permissions";
import { useSession } from "@/providers/session-provider";
import {
  getBusinessUnitName,
  getLatestActivityNote,
  getLatestSubmittedAt,
  getUserName,
  submitRequest,
} from "@/services/request.service";

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="max-w-[60%] text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

export function RequestDetailPage({
  id,
}: {
  id: string;
}) {
  const { user } =
    useSession();

  const request =
    useRequest(
      user,
      id,
    );

  const [
    pendingAction,
    setPendingAction,
  ] =
    useState<RequestAction | null>(
      null,
    );

  const [
    actionError,
    setActionError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  if (!user) {
    return null;
  }

  if (!request) {
    return (
      <>
        <PageHeader
          title="Detail Pengajuan"
        />

        <EmptyState
          title="Pengajuan tidak ditemukan"
          description="Pengajuan tidak tersedia atau tidak dapat diakses dengan role Anda saat ini."
          action={
            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <Link to="/pengajuan">
                Kembali ke daftar
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  const actions =
    availableActions(
      user,
      request,
    );

  const supporting =
    request.documents.filter(
      (document) =>
        document.type ===
        "LAMPIRAN",
    );

  const official =
    request.documents.filter(
      (document) =>
        document.type !==
        "LAMPIRAN",
    );

  const revisionNote =
    getLatestActivityNote(
      request,
      "REVISION_REQUESTED",
    );

  const rejectionReason =
    getLatestActivityNote(
      request,
      "REJECTED",
    );

  const submittedAt =
    getLatestSubmittedAt(
      request,
    );

  const handleEdit =
    () => {
      window.location.assign(
        `/pengajuan/baru?edit=${request.id}`,
      );
    };

  const handleConfirmAction =
    () => {
      if (
        !pendingAction ||
        isProcessing
      ) {
        return;
      }

      setActionError(
        null,
      );

      setIsProcessing(
        true,
      );

      try {
        if (
          pendingAction ===
          "SUBMIT"
        ) {
          submitRequest(
            user,
            request.id,
          );
        }

        /*
         * Action Finance akan diimplementasikan pada Step 3 dan Step 4.
         * Untuk Step 2 hanya mutation UNIT_USER yang diaktifkan.
         */

        setPendingAction(
          null,
        );
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Aksi gagal diproses.",
        );
      } finally {
        setIsProcessing(
          false,
        );
      }
    };

  const getActionDescription =
    (
      action: RequestAction,
    ): string => {
      switch (action) {
        case "SUBMIT":
          return request.status ===
            "REVISION_REQUIRED"
            ? "Pengajuan akan diajukan ulang dan kembali masuk ke antrean review Finance."
            : "Pengajuan akan dikirim ke Finance dan tidak dapat diubah sampai Finance meminta revisi.";

        case "START_REVIEW":
          return "Review Finance akan dimulai.";

        case "REQUEST_REVISION":
          return "Finance akan meminta Unit Bisnis memperbaiki pengajuan.";

        case "REJECT":
          return "Pengajuan akan ditolak.";

        case "APPROVE":
          return "Pengajuan akan disetujui dan masuk ke tahap pembayaran.";

        case "PROCESS_PAYMENT":
          return "Pengajuan akan diproses ke tahap pembayaran.";

        default:
          return "Konfirmasi aksi pada pengajuan ini.";
      }
    };

  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground"
      >
        <Link to="/pengajuan">
          <ArrowLeft
            className="size-4"
            aria-hidden
          />
          Kembali
        </Link>
      </Button>

      <PageHeader
        title={
          request.title
        }
        description={`${request.requestNumber} · ${getBusinessUnitName(request.businessUnitId)}`}
        actions={
          <>
            <StatusBadge
              status={
                request.status
              }
              className="px-2.5 py-1 text-sm"
            />

            {actions.map(
              (action) => {
                if (
                  action ===
                  "EDIT"
                ) {
                  return (
                    <Button
                      key={
                        action
                      }
                      size="sm"
                      variant="outline"
                      onClick={
                        handleEdit
                      }
                    >
                      <Pencil
                        className="size-3.5"
                        aria-hidden
                      />
                      {
                        ACTION_LABELS[
                          action
                        ]
                      }
                    </Button>
                  );
                }

                return (
                  <Button
                    key={
                      action
                    }
                    size="sm"
                    disabled={
                      isProcessing
                    }
                    variant={
                      action ===
                      "REJECT"
                        ? "destructive"
                        : "outline"
                    }
                    className={
                      action ===
                        "APPROVE" ||
                      action ===
                        "PROCESS_PAYMENT" ||
                      action ===
                        "SUBMIT"
                        ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                        : ""
                    }
                    onClick={() =>
                      setPendingAction(
                        action,
                      )
                    }
                  >
                    {
                      ACTION_LABELS[
                        action
                      ]
                    }
                  </Button>
                );
              },
            )}
          </>
        }
      />

      {actionError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      {request.status ===
        "REVISION_REQUIRED" &&
      revisionNote ? (
        <div className="flex gap-3 rounded-lg border border-status-revision/30 bg-status-revision/8 p-4">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-status-revision"
            aria-hidden
          />

          <div>
            <p className="text-sm font-semibold text-foreground">
              Perlu Revisi
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {revisionNote}
            </p>
          </div>
        </div>
      ) : null}

      {request.status ===
        "REJECTED" &&
      rejectionReason ? (
        <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/8 p-4">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden
          />

          <div>
            <p className="text-sm font-semibold text-foreground">
              Pengajuan Ditolak
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {
                rejectionReason
              }
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">
              Informasi Pengajuan
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {
                request.description
              }
            </p>

            <div className="mt-3">
              <InfoRow
                label="Kategori"
                value={
                  CATEGORY_LABELS[
                    request
                      .category
                  ]
                }
              />

              <InfoRow
                label="Nominal"
                value={formatRupiah(
                  request.amount,
                )}
              />

              <InfoRow
                label="Pemohon"
                value={getUserName(
                  request.requesterId,
                )}
              />

              <InfoRow
                label="Unit Bisnis"
                value={getBusinessUnitName(
                  request.businessUnitId,
                )}
              />

              <InfoRow
                label="Dibutuhkan Tanggal"
                value={formatTanggal(
                  request.neededAt,
                )}
              />

              <InfoRow
                label="Dibuat"
                value={formatTanggal(
                  request.createdAt,
                )}
              />

              <InfoRow
                label="Tanggal Diajukan"
                value={
                  submittedAt
                    ? formatTanggal(
                        submittedAt,
                      )
                    : "Belum diajukan"
                }
              />

              <InfoRow
                label="Tanggal Pembayaran"
                value={
                  request.paidAt
                    ? formatTanggal(
                        request.paidAt,
                      )
                    : "Belum dibayar"
                }
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">
              Informasi Penerima
            </h2>

            <div className="mt-2">
              <InfoRow
                label="Nama Penerima"
                value={
                  request.beneficiaryName
                }
              />

              <InfoRow
                label="Bank"
                value={
                  request.beneficiaryBank
                }
              />

              <InfoRow
                label="Nomor Rekening"
                value={
                  request.beneficiaryAccount
                }
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">
              Dokumen Pendukung
            </h2>

            {supporting.length ===
            0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Belum ada dokumen pendukung.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {supporting.map(
                  (
                    document,
                  ) => (
                    <li
                      key={
                        document.id
                      }
                      className="flex items-center gap-3 py-2.5"
                    >
                      <FileText
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-foreground">
                          {
                            document.name
                          }
                        </span>

                        <span className="block text-xs text-muted-foreground">
                          {formatUkuranFile(
                            document.sizeKb,
                          )}{" "}
                          ·{" "}
                          {
                            document.uploadedBy
                          }
                        </span>
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="text-muted-foreground"
                      >
                        <Download
                          className="size-3.5"
                          aria-hidden
                        />
                        Unduh
                      </Button>
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">
              Surat Persetujuan & Bukti Transfer
            </h2>

            {official.length ===
            0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Dokumen resmi akan tersedia setelah pengajuan disetujui dan dibayarkan.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {official.map(
                  (
                    document,
                  ) => (
                    <li
                      key={
                        document.id
                      }
                      className="flex items-center gap-3 py-2.5"
                    >
                      <FileText
                        className="size-4 text-primary"
                        aria-hidden
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-foreground">
                          {
                            document.name
                          }
                        </span>

                        <span className="block text-xs text-muted-foreground">
                          {
                            DOCUMENT_TYPE_LABELS[
                              document
                                .type
                            ]
                          }{" "}
                          ·{" "}
                          {formatUkuranFile(
                            document.sizeKb,
                          )}
                        </span>
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="text-muted-foreground"
                      >
                        <Download
                          className="size-3.5"
                          aria-hidden
                        />
                        Unduh
                      </Button>
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-lg border border-border bg-card p-4 shadow-card lg:col-span-1">
          <h2 className="text-sm font-semibold text-foreground">
            Riwayat Aktivitas
          </h2>

          <div className="mt-4">
            <ActivityTimeline
              entries={
                request.activities
              }
            />
          </div>
        </section>
      </div>

      <ConfirmationDialog
        open={
          pendingAction !==
          null
        }
        onOpenChange={(
          open,
        ) => {
          if (!open) {
            setPendingAction(
              null,
            );
          }
        }}
        title={
          pendingAction
            ? ACTION_LABELS[
                pendingAction
              ]
            : ""
        }
        description={
          pendingAction
            ? getActionDescription(
                pendingAction,
              )
            : ""
        }
        confirmLabel={
          pendingAction ===
          "SUBMIT"
            ? request.status ===
              "REVISION_REQUIRED"
              ? "Ajukan Ulang"
              : "Ya, Ajukan"
            : "Konfirmasi"
        }
        destructive={
          pendingAction ===
          "REJECT"
        }
        onConfirm={
          handleConfirmAction
        }
      />
    </>
  );
}