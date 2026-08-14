import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import type { FileUploadItem } from "@/components/common/FileUpload";
import { getLatestActivityNote } from "@/services/request.service";
import {
  createAndSubmitRequest,
  saveDraftRequest,
  submitRequest,
  updateRequest,
  type CreateRequestInput,
} from "@/services/request-write.service";
import { getBusinessUnit } from "@/services/user.service";
import type { FinanceRequest, RequestCategory, User } from "@/types";

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
          uploadedAt: document.uploadedAt,
          uploadedBy: document.uploadedBy,
        })) ?? [],
  };
}

export function useRequestForm(user: User, initialRequest?: FinanceRequest) {
  const navigate = useNavigate();

  const [values, setValues] = useState<RequestFormValues>(() =>
    createInitialValues(initialRequest),
  );

  const [errors, setErrors] = useState<RequestFormErrors>({});

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  const numericAmount = useMemo(() => Number(values.amount.replace(/\D/g, "")), [values.amount]);

  const unit = getBusinessUnit(user.businessUnitId);
  const isEditMode = Boolean(initialRequest);
  const isRevision = initialRequest?.status === "REVISION_REQUIRED";

  const revisionNote = initialRequest
    ? getLatestActivityNote(initialRequest, "REVISION_REQUESTED")
    : null;

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
    attachments: values.attachments.map((file) => ({
      id: file.id,
      name: file.name,
      sizeKb: file.sizeKb,
      uploadedAt: file.uploadedAt,
      uploadedBy: file.uploadedBy,
    })),
  });

  const goToRequest = (requestId: string) => {
    void navigate({
      to: "/pengajuan/$id",
      params: { id: requestId },
    });
  };

  const handleSaveDraft = () => {
    if (isSaving || !validateDraft()) {
      return;
    }

    setActionError(null);
    setIsSaving(true);

    try {
      const request = initialRequest
        ? updateRequest(user, initialRequest.id, getInput())
        : saveDraftRequest(user, getInput());

      goToRequest(request.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal menyimpan pengajuan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSubmit = () => {
    if (isSaving || !validateSubmit()) {
      return;
    }

    setActionError(null);
    setSubmitDialogOpen(true);
  };

  const handleSubmit = (): boolean => {
    if (isSaving) {
      return false;
    }

    setActionError(null);
    setIsSaving(true);

    try {
      let request: FinanceRequest;

      if (initialRequest) {
        updateRequest(user, initialRequest.id, getInput());

        request = submitRequest(user, initialRequest.id);
      } else {
        request = createAndSubmitRequest(user, getInput());
      }

      goToRequest(request.id);
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal mengajukan pengajuan.");

      return false;
    } finally {
      setIsSaving(false);
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
