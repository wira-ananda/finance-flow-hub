import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { useSyncRequestAttachmentsMutation } from "@/hooks/use-attachments";
import { useBusinessUnits } from "@/hooks/use-business-units";
import {
  useCreateRequestMutation,
  useSubmitRequestMutation,
  useUpdateRequestMutation,
} from "@/hooks/use-requests";
import { getLatestActivityNote } from "@/services/request.service";

import type { CreateRequestInput } from "@/services/request-write.service";
import type { FinanceRequest, RequestCategory, User } from "@/types";
import type { FileUploadItem } from "@/types/files";

export interface RequestFormValues {
  title: string;
  category: RequestCategory;
  amount: string;
  description: string;
  neededAt: string;
  beneficiaryName: string;
  beneficiaryBank: string;
  beneficiaryAccount: string;
  attachments: FileUploadItem[];
}

export interface RequestFormErrors {
  title?: string;
  amount?: string;
  description?: string;
  neededAt?: string;
  beneficiaryName?: string;
  beneficiaryBank?: string;
  beneficiaryAccount?: string;
}

export type RequestFormFieldSetter = <K extends keyof RequestFormValues>(
  field: K,
  value: RequestFormValues[K],
) => void;

function createInitialValues(request?: FinanceRequest): RequestFormValues {
  return {
    title: request?.title ?? "",
    category: request?.category ?? "OPERASIONAL",
    amount: request ? String(request.amount) : "",
    description: request?.description ?? "",
    neededAt: request?.neededAt.slice(0, 10) ?? "",
    beneficiaryName: request?.beneficiaryName ?? "",
    beneficiaryBank: request?.beneficiaryBank ?? "",
    beneficiaryAccount: request?.beneficiaryAccount ?? "",
    attachments:
      request?.documents
        .filter((document) => document.type === "LAMPIRAN")
        .map((document) => ({
          id: document.id,
          name: document.name,
          sizeKb: document.sizeKb,
          mimeType: document.mimeType ?? "application/octet-stream",
          uploadedAt: document.uploadedAt,
          uploadedBy: document.uploadedBy,
          ...(document.fileUrl ? { fileUrl: document.fileUrl } : {}),
        })) ?? [],
  };
}

/**
 * Mengelola form request, termasuk create/update, sinkronisasi attachment, dan submit bertahap.
 */
export function useRequestForm(user: User, initialRequest?: FinanceRequest) {
  const navigate = useNavigate();
  const businessUnits = useBusinessUnits();
  const createMutation = useCreateRequestMutation(user);
  const updateMutation = useUpdateRequestMutation(user);
  const submitMutation = useSubmitRequestMutation(user);
  const syncAttachmentsMutation = useSyncRequestAttachmentsMutation(user);

  const [values, setValues] = useState<RequestFormValues>(() =>
    createInitialValues(initialRequest),
  );
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /*
   * Jika create draft sudah sukses tetapi upload attachment gagal,
   * ID ini mencegah retry membuat request duplikat.
   */
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

  const numericAmount = Number(values.amount.replace(/\D/g, ""));
  const unit = businessUnits.find((item) => item.id === user.businessUnitId);
  const isEditMode = Boolean(initialRequest || createdRequestId);
  const isRevision = initialRequest?.status === "REVISION_REQUIRED";
  const revisionNote = initialRequest
    ? getLatestActivityNote(initialRequest, "REVISION_REQUESTED")
    : null;

  const initialAttachmentIds =
    initialRequest?.documents
      .filter((document) => document.type === "LAMPIRAN")
      .map((document) => document.id) ?? [];

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    submitMutation.isPending ||
    syncAttachmentsMutation.isPending;

  const setField: RequestFormFieldSetter = (field, value) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateDraft = (): boolean => {
    const nextErrors: RequestFormErrors = {};

    if (!values.title.trim()) {
      nextErrors.title = "Judul pengajuan wajib diisi sebelum menyimpan draf.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const validateSubmit = (): boolean => {
    const nextErrors: RequestFormErrors = {};

    if (!values.title.trim()) {
      nextErrors.title = "Judul pengajuan wajib diisi.";
    }

    if (numericAmount <= 0) {
      nextErrors.amount = "Nominal harus lebih besar dari Rp0.";
    }

    if (!values.description.trim()) {
      nextErrors.description = "Deskripsi dan justifikasi wajib diisi.";
    }

    if (!values.neededAt) {
      nextErrors.neededAt = "Tanggal dana dibutuhkan wajib diisi.";
    }

    if (!values.beneficiaryName.trim()) {
      nextErrors.beneficiaryName = "Nama penerima wajib diisi.";
    }

    if (!values.beneficiaryBank.trim()) {
      nextErrors.beneficiaryBank = "Bank penerima wajib diisi.";
    }

    if (!values.beneficiaryAccount.trim()) {
      nextErrors.beneficiaryAccount = "Nomor rekening wajib diisi.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const getInput = (): CreateRequestInput => ({
    title: values.title,
    description: values.description,
    category: values.category,
    amount: numericAmount,
    neededAt: values.neededAt,
    beneficiaryName: values.beneficiaryName,
    beneficiaryBank: values.beneficiaryBank,
    beneficiaryAccount: values.beneficiaryAccount,
  });

  const persistEditableRequest = async (): Promise<FinanceRequest> => {
    const editableRequestId = initialRequest?.id ?? createdRequestId;

    if (editableRequestId) {
      return updateMutation.mutateAsync({
        requestId: editableRequestId,
        input: getInput(),
        refresh: false,
      });
    }

    const created = await createMutation.mutateAsync({
      input: getInput(),
      refresh: false,
    });

    setCreatedRequestId(created.id);

    return created;
  };

  const syncAttachments = async (requestId: string, refresh: boolean) => {
    await syncAttachmentsMutation.mutateAsync({
      requestId,
      initialAttachmentIds,
      files: values.attachments,
      refresh,
    });
  };

  const goToRequest = async (requestId: string) => {
    await navigate({
      to: "/pengajuan/$id",
      params: {
        id: requestId,
      },
    });
  };

  const handleSaveDraft = async (): Promise<boolean> => {
    if (isSaving || !validateDraft()) {
      return false;
    }

    setActionError(null);

    try {
      const request = await persistEditableRequest();

      await syncAttachments(request.id, true);
      await goToRequest(request.id);

      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal menyimpan pengajuan.");

      return false;
    }
  };

  const handleOpenSubmit = () => {
    if (isSaving || !validateSubmit()) {
      return;
    }

    setActionError(null);
    setSubmitDialogOpen(true);
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (isSaving) {
      return false;
    }

    setActionError(null);

    try {
      const editableRequest = await persistEditableRequest();

      /*
       * Attachment wajib selesai saat request masih DRAFT/REVISION_REQUIRED.
       * Setelah itu baru status dipindahkan ke SUBMITTED.
       */
      await syncAttachments(editableRequest.id, false);

      const submitted = await submitMutation.mutateAsync(editableRequest.id);

      await goToRequest(submitted.id);

      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengajukan pengajuan.");

      return false;
    }
  };

  return {
    values,
    errors,
    setField,
    numericAmount,
    unit,
    isEditMode,
    isRevision,
    revisionNote,
    submitDialogOpen,
    setSubmitDialogOpen,
    isSaving,
    actionError,
    handleSaveDraft,
    handleOpenSubmit,
    handleSubmit,
  };
}
