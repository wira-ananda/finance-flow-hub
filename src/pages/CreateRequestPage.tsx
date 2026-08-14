import {
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  Info,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { EmptyState } from "@/components/common/EmptyState";
import {
  FileUpload,
  type FileUploadItem,
} from "@/components/common/FileUpload";
import { FormField } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS } from "@/constants/status";
import { useRequest } from "@/hooks/use-requests";
import { formatRupiah } from "@/lib/formatters";
import { canPerform } from "@/lib/permissions";
import { useSession } from "@/providers/session-provider";
import {
  createAndSubmitRequest,
  getLatestActivityNote,
  saveDraftRequest,
  submitRequest,
  updateRequest,
} from "@/services/request.service";
import { getBusinessUnit } from "@/services/user.service";
import type {
  FinanceRequest,
  RequestCategory,
  User,
} from "@/types";

const CATEGORIES =
  Object.keys(
    CATEGORY_LABELS,
  ) as RequestCategory[];

interface FormErrors {
  title?: string;
  amount?: string;
  description?: string;
  neededAt?: string;
  beneficiaryName?: string;
  beneficiaryBank?: string;
  beneficiaryAccount?: string;
}

function getEditRequestId(
  search: unknown,
): string | null {
  if (
    typeof search !==
      "object" ||
    search === null
  ) {
    return null;
  }

  const edit =
    (
      search as Record<
        string,
        unknown
      >
    ).edit;

  return typeof edit ===
    "string"
    ? edit
    : null;
}

function getDateInputValue(
  value?: string,
): string {
  return value
    ? value.slice(0, 10)
    : "";
}

interface RequestFormProps {
  user: User;
  initialRequest?: FinanceRequest;
}

function RequestForm({
  user,
  initialRequest,
}: RequestFormProps) {
  const navigate =
    useNavigate();

  const unit =
    getBusinessUnit(
      user.businessUnitId,
    );

  const isEditMode =
    Boolean(
      initialRequest,
    );

  const [
    title,
    setTitle,
  ] = useState(
    initialRequest?.title ??
      "",
  );

  const [
    category,
    setCategory,
  ] =
    useState<RequestCategory>(
      initialRequest?.category ??
        "OPERASIONAL",
    );

  const [
    amount,
    setAmount,
  ] = useState(
    initialRequest
      ? String(
          initialRequest.amount,
        )
      : "",
  );

  const [
    description,
    setDescription,
  ] = useState(
    initialRequest?.description ??
      "",
  );

  const [
    neededAt,
    setNeededAt,
  ] = useState(
    getDateInputValue(
      initialRequest?.neededAt,
    ),
  );

  const [
    beneficiaryName,
    setBeneficiaryName,
  ] = useState(
    initialRequest?.beneficiaryName ??
      "",
  );

  const [
    beneficiaryBank,
    setBeneficiaryBank,
  ] = useState(
    initialRequest?.beneficiaryBank ??
      "",
  );

  const [
    beneficiaryAccount,
    setBeneficiaryAccount,
  ] = useState(
    initialRequest?.beneficiaryAccount ??
      "",
  );

  const [
    attachments,
    setAttachments,
  ] =
    useState<FileUploadItem[]>(
      () =>
        initialRequest?.documents
          .filter(
            (document) =>
              document.type ===
              "LAMPIRAN",
          )
          .map(
            (document) => ({
              id:
                document.id,
              name:
                document.name,
              sizeKb:
                document.sizeKb,
              uploadedAt:
                document.uploadedAt,
              uploadedBy:
                document.uploadedBy,
            }),
          ) ?? [],
    );

  const [
    errors,
    setErrors,
  ] =
    useState<FormErrors>(
      {},
    );

  const [
    submitDialogOpen,
    setSubmitDialogOpen,
  ] =
    useState(false);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    actionError,
    setActionError,
  ] =
    useState<string | null>(
      null,
    );

  const numericAmount =
    useMemo(
      () =>
        Number(
          amount.replace(
            /\D/g,
            "",
          ),
        ),
      [amount],
    );

  const revisionNote =
    initialRequest
      ? getLatestActivityNote(
          initialRequest,
          "REVISION_REQUESTED",
        )
      : null;

  const validateDraft =
    (): boolean => {
      const nextErrors:
        FormErrors =
        {};

      if (!title.trim()) {
        nextErrors.title =
          "Judul pengajuan wajib diisi sebelum menyimpan draf.";
      }

      setErrors(
        nextErrors,
      );

      return (
        Object.keys(
          nextErrors,
        ).length === 0
      );
    };

  const validateSubmit =
    (): boolean => {
      const nextErrors:
        FormErrors =
        {};

      if (!title.trim()) {
        nextErrors.title =
          "Judul pengajuan wajib diisi.";
      }

      if (
        numericAmount <= 0
      ) {
        nextErrors.amount =
          "Nominal harus lebih besar dari Rp0.";
      }

      if (
        !description.trim()
      ) {
        nextErrors.description =
          "Deskripsi dan justifikasi wajib diisi.";
      }

      if (!neededAt) {
        nextErrors.neededAt =
          "Tanggal dana dibutuhkan wajib diisi.";
      }

      if (
        !beneficiaryName.trim()
      ) {
        nextErrors.beneficiaryName =
          "Nama penerima wajib diisi.";
      }

      if (
        !beneficiaryBank.trim()
      ) {
        nextErrors.beneficiaryBank =
          "Bank penerima wajib diisi.";
      }

      if (
        !beneficiaryAccount.trim()
      ) {
        nextErrors.beneficiaryAccount =
          "Nomor rekening wajib diisi.";
      }

      setErrors(
        nextErrors,
      );

      return (
        Object.keys(
          nextErrors,
        ).length === 0
      );
    };

  const getInput =
    () => ({
      title,
      description,
      category,
      amount:
        numericAmount,
      neededAt,
      beneficiaryName,
      beneficiaryBank,
      beneficiaryAccount,

      attachments:
        attachments.map(
          (file) => ({
            id:
              file.id,
            name:
              file.name,
            sizeKb:
              file.sizeKb,
            uploadedAt:
              file.uploadedAt,
            uploadedBy:
              file.uploadedBy,
          }),
        ),
    });

  const goToRequest =
    (
      requestId: string,
    ) => {
      void navigate({
        to: "/pengajuan/$id",
        params: {
          id:
            requestId,
        },
      });
    };

  const handleSaveDraft =
    () => {
      if (
        isSaving ||
        !validateDraft()
      ) {
        return;
      }

      setActionError(
        null,
      );

      setIsSaving(
        true,
      );

      try {
        const request =
          initialRequest
            ? updateRequest(
                user,
                initialRequest.id,
                getInput(),
              )
            : saveDraftRequest(
                user,
                getInput(),
              );

        goToRequest(
          request.id,
        );
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Gagal menyimpan pengajuan.",
        );
      } finally {
        setIsSaving(
          false,
        );
      }
    };

  const handleOpenSubmit =
    () => {
      if (
        isSaving ||
        !validateSubmit()
      ) {
        return;
      }

      setActionError(
        null,
      );

      setSubmitDialogOpen(
        true,
      );
    };

  const handleSubmit =
    () => {
      if (isSaving) {
        return;
      }

      setActionError(
        null,
      );

      setIsSaving(
        true,
      );

      try {
        let request:
          FinanceRequest;

        if (
          initialRequest
        ) {
          updateRequest(
            user,
            initialRequest.id,
            getInput(),
          );

          request =
            submitRequest(
              user,
              initialRequest.id,
            );
        } else {
          request =
            createAndSubmitRequest(
              user,
              getInput(),
            );
        }

        goToRequest(
          request.id,
        );
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Gagal mengajukan pengajuan.",
        );

        throw error;
      } finally {
        setIsSaving(
          false,
        );
      }
    };

  const isRevision =
    initialRequest?.status ===
    "REVISION_REQUIRED";

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
          isEditMode
            ? "Ubah Pengajuan Keuangan"
            : "Buat Pengajuan Keuangan"
        }
        description={
          isRevision
            ? "Perbaiki pengajuan sesuai catatan Finance, kemudian ajukan ulang."
            : "Lengkapi informasi pengajuan sebelum dikirim ke tim Finance untuk direview."
        }
      />

      {isRevision ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-status-revision/30 bg-status-revision/10 p-4">
          <Info
            className="mt-0.5 size-4 shrink-0 text-status-revision"
            aria-hidden
          />

          <div>
            <p className="text-sm font-medium text-foreground">
              Catatan Revisi Finance
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {revisionNote ??
                "Finance meminta pengajuan ini diperbaiki sebelum diajukan kembali."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-background-subtle p-3.5">
          <Info
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden
          />

          <p className="text-sm text-muted-foreground">
            Selama tahap development, data dan metadata dokumen disimpan secara lokal di browser.
          </p>
        </div>
      )}

      {actionError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {actionError}
        </div>
      ) : null}

      <form
        className="grid gap-4 lg:grid-cols-3"
        onSubmit={(
          event,
        ) => {
          event.preventDefault();

          handleOpenSubmit();
        }}
      >
        <div className="space-y-4 lg:col-span-2">
          <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">
              Detail Pengajuan
            </h2>

            <FormField
              label="Judul Pengajuan"
              htmlFor="title"
              required
              error={
                errors.title
              }
            >
              <Input
                id="title"
                value={title}
                disabled={
                  isSaving
                }
                onChange={(
                  event,
                ) =>
                  setTitle(
                    event.target
                      .value,
                  )
                }
                placeholder="Contoh: Pembayaran Servis Armada Bulan Agustus"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Kategori"
                required
              >
                <Select
                  value={
                    category
                  }
                  disabled={
                    isSaving
                  }
                  onValueChange={(
                    value,
                  ) =>
                    setCategory(
                      value as RequestCategory,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {CATEGORIES.map(
                      (
                        item,
                      ) => (
                        <SelectItem
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {
                            CATEGORY_LABELS[
                              item
                            ]
                          }
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Nominal Pengajuan"
                htmlFor="amount"
                required
                error={
                  errors.amount
                }
                hint={
                  numericAmount >
                  0
                    ? formatRupiah(
                        numericAmount,
                      )
                    : "Masukkan angka tanpa titik."
                }
              >
                <Input
                  id="amount"
                  inputMode="numeric"
                  value={amount}
                  disabled={
                    isSaving
                  }
                  onChange={(
                    event,
                  ) =>
                    setAmount(
                      event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                  placeholder="0"
                  className="num"
                />
              </FormField>
            </div>

            <FormField
              label="Deskripsi & Justifikasi"
              htmlFor="description"
              required
              error={
                errors.description
              }
            >
              <Textarea
                id="description"
                rows={4}
                value={
                  description
                }
                disabled={
                  isSaving
                }
                onChange={(
                  event,
                ) =>
                  setDescription(
                    event.target
                      .value,
                  )
                }
                placeholder="Jelaskan kebutuhan, urgensi, dan rincian penggunaan dana."
              />
            </FormField>

            <FormField
              label="Tanggal Dana Dibutuhkan"
              htmlFor="needed"
              required
              error={
                errors.neededAt
              }
            >
              <Input
                id="needed"
                type="date"
                value={
                  neededAt
                }
                disabled={
                  isSaving
                }
                onChange={(
                  event,
                ) =>
                  setNeededAt(
                    event.target
                      .value,
                  )
                }
              />
            </FormField>
          </section>

          <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">
              Informasi Penerima
            </h2>

            <FormField
              label="Nama Penerima"
              htmlFor="beneficiary"
              required
              error={
                errors.beneficiaryName
              }
            >
              <Input
                id="beneficiary"
                value={
                  beneficiaryName
                }
                disabled={
                  isSaving
                }
                onChange={(
                  event,
                ) =>
                  setBeneficiaryName(
                    event.target
                      .value,
                  )
                }
                placeholder="Nama vendor atau karyawan"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Bank"
                htmlFor="bank"
                required
                error={
                  errors.beneficiaryBank
                }
              >
                <Input
                  id="bank"
                  value={
                    beneficiaryBank
                  }
                  disabled={
                    isSaving
                  }
                  onChange={(
                    event,
                  ) =>
                    setBeneficiaryBank(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Contoh: Bank Mandiri"
                />
              </FormField>

              <FormField
                label="Nomor Rekening"
                htmlFor="account"
                required
                error={
                  errors.beneficiaryAccount
                }
              >
                <Input
                  id="account"
                  value={
                    beneficiaryAccount
                  }
                  disabled={
                    isSaving
                  }
                  onChange={(
                    event,
                  ) =>
                    setBeneficiaryAccount(
                      event.target
                        .value,
                    )
                  }
                  className="num"
                  placeholder="1234567890"
                />
              </FormField>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Dokumen Pendukung
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Tambahkan invoice, quotation, kwitansi, atau dokumen lain yang mendukung pengajuan.
              </p>
            </div>

            <FileUpload
              value={
                attachments
              }
              onChange={
                setAttachments
              }
              disabled={
                isSaving
              }
            />
          </section>
        </div>

        <aside className="space-y-4">
          <section className="surface-emphasis space-y-3 rounded-lg border border-border p-4">
            <h2 className="text-sm font-semibold text-foreground">
              Ringkasan
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  Pemohon
                </span>

                <span className="text-right font-medium text-foreground">
                  {user.name}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  Unit Bisnis
                </span>

                <span className="text-right font-medium text-foreground">
                  {unit?.name ??
                    "-"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  Dokumen
                </span>

                <span className="num font-medium text-foreground">
                  {
                    attachments.length
                  }
                </span>
              </div>

              <div className="flex justify-between gap-3 border-t border-border pt-2">
                <span className="text-muted-foreground">
                  Nominal
                </span>

                <span className="num text-right font-semibold text-foreground">
                  {formatRupiah(
                    numericAmount ||
                      0,
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                type="submit"
                disabled={
                  isSaving
                }
                className="bg-primary hover:bg-primary-hover"
              >
                {isRevision
                  ? "Ajukan Ulang"
                  : "Ajukan ke Finance"}
              </Button>

              {!isRevision ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    isSaving
                  }
                  onClick={
                    handleSaveDraft
                  }
                >
                  {isEditMode
                    ? "Simpan Perubahan"
                    : "Simpan sebagai Draf"}
                </Button>
              ) : null}
            </div>
          </section>

          <p className="px-1 text-xs leading-5 text-muted-foreground">
            Setelah diajukan, status berubah menjadi Diajukan dan pengajuan masuk ke antrean review Finance.
          </p>
        </aside>
      </form>

      <ConfirmationDialog
        open={
          submitDialogOpen
        }
        onOpenChange={
          setSubmitDialogOpen
        }
        title={
          isRevision
            ? "Ajukan Ulang"
            : "Ajukan ke Finance"
        }
        description={
          isRevision
            ? "Pastikan semua perbaikan sudah sesuai catatan Finance. Pengajuan akan kembali masuk ke antrean review."
            : "Pastikan seluruh informasi sudah benar. Setelah diajukan, pengajuan tidak dapat diubah sebelum Finance meminta revisi."
        }
        confirmLabel={
          isRevision
            ? "Ya, Ajukan Ulang"
            : "Ya, Ajukan"
        }
        onConfirm={
          handleSubmit
        }
      />
    </>
  );
}

export function CreateRequestPage() {
  const { user } =
    useSession();

  const search =
    useRouterState({
      select: (state) =>
        state.location
          .search,
    });

  const editRequestId =
    getEditRequestId(
      search,
    );

  const requestToEdit =
    useRequest(
      user,
      editRequestId,
    );

  if (!user) {
    return null;
  }

  if (
    user.role !==
    "UNIT_USER"
  ) {
    return (
      <>
        <PageHeader
          title="Buat Pengajuan"
        />

        <EmptyState
          title="Akses tidak tersedia"
          description="Hanya pengguna Unit Bisnis yang dapat membuat pengajuan."
          action={
            <Button
              asChild
              variant="outline"
            >
              <Link to="/">
                Kembali ke Dashboard
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  if (
    editRequestId &&
    !requestToEdit
  ) {
    return (
      <>
        <PageHeader
          title="Ubah Pengajuan"
        />

        <EmptyState
          title="Pengajuan tidak ditemukan"
          description="Pengajuan tidak tersedia atau tidak dapat Anda akses."
          action={
            <Button
              asChild
              variant="outline"
            >
              <Link to="/pengajuan">
                Kembali ke Pengajuan Saya
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  if (
    requestToEdit &&
    !canPerform(
      user,
      requestToEdit,
      "EDIT",
    )
  ) {
    return (
      <>
        <PageHeader
          title="Ubah Pengajuan"
        />

        <EmptyState
          title="Pengajuan tidak dapat diubah"
          description="Hanya pengajuan dengan status Draf atau Perlu Revisi yang dapat diubah."
          action={
            <Button
              asChild
              variant="outline"
            >
              <Link to="/pengajuan">
                Kembali ke Pengajuan Saya
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <RequestForm
      key={
        requestToEdit?.id ??
        "new-request"
      }
      user={user}
      initialRequest={
        requestToEdit
      }
    />
  );
}