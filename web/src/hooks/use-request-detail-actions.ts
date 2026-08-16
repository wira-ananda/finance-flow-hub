import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { usePaymentMutation } from "@/hooks/use-payment-actions";
import { useSubmitRequestMutation } from "@/hooks/use-requests";
import { useReviewMutation } from "@/hooks/use-review-actions";

import type { RequestAction } from "@/lib/permissions";
import type { ProcessPaymentInput } from "@/services/payment.service";
import type { FinanceRequest, User } from "@/types";

export type ReviewDialogType = "revision" | "reject";

interface UseRequestDetailActionsOptions {
  user: User | null;
  request: FinanceRequest | undefined;
}

/**
 * Mengelola interaction state untuk submit, review, dan payment dari halaman detail.
 * Seluruh network mutation tetap dijalankan melalui TanStack Query, bukan useEffect.
 */
export function useRequestDetailActions({ user, request }: UseRequestDetailActionsOptions) {
  const navigate = useNavigate();

  const [pendingAction, setPendingAction] = useState<RequestAction | null>(null);
  const [reviewDialogType, setReviewDialogType] = useState<ReviewDialogType | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const submitMutation = useSubmitRequestMutation(user);
  const reviewMutation = useReviewMutation(user);
  const paymentMutation = usePaymentMutation(user);

  const isProcessing =
    submitMutation.isPending || reviewMutation.isPending || paymentMutation.isPending;

  const handleAction = (action: RequestAction) => {
    if (!request || isProcessing) {
      return;
    }

    setActionError(null);

    switch (action) {
      case "EDIT":
        void navigate({
          to: "/pengajuan/baru",
          search: {
            edit: request.id,
          },
        });
        return;

      case "REQUEST_REVISION":
        setReviewDialogType("revision");
        return;

      case "REJECT":
        setReviewDialogType("reject");
        return;

      case "PROCESS_PAYMENT":
        setPaymentDialogOpen(true);
        return;

      case "SUBMIT":
      case "START_REVIEW":
      case "APPROVE":
        setPendingAction(action);
        return;

      case "VIEW":
        return;
    }
  };

  const handleConfirmAction = async (): Promise<boolean> => {
    if (!request || !pendingAction || isProcessing) {
      return false;
    }

    setActionError(null);

    try {
      switch (pendingAction) {
        case "SUBMIT":
          await submitMutation.mutateAsync(request.id);
          break;

        case "START_REVIEW":
          await reviewMutation.mutateAsync({
            type: "START_REVIEW",
            requestId: request.id,
          });
          break;

        case "APPROVE":
          await reviewMutation.mutateAsync({
            type: "APPROVE",
            requestId: request.id,
          });
          break;

        default:
          return false;
      }

      setPendingAction(null);

      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Aksi pengajuan gagal diproses.");

      return false;
    }
  };

  const handleReviewConfirm = async (note: string): Promise<boolean> => {
    if (!request || !reviewDialogType || isProcessing) {
      return false;
    }

    setActionError(null);

    try {
      if (reviewDialogType === "revision") {
        await reviewMutation.mutateAsync({
          type: "REQUEST_REVISION",
          requestId: request.id,
          notes: note,
        });
      } else {
        await reviewMutation.mutateAsync({
          type: "REJECT",
          requestId: request.id,
          reason: note,
        });
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Review gagal diproses.";

      setActionError(message);

      throw new Error(message);
    }
  };

  const handlePaymentConfirm = async (input: ProcessPaymentInput): Promise<boolean> => {
    if (!request || isProcessing) {
      return false;
    }

    setActionError(null);

    try {
      await paymentMutation.mutateAsync({
        requestId: request.id,
        input,
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pembayaran gagal diproses.";

      setActionError(message);

      throw new Error(message);
    }
  };

  const getActionDescription = (action: RequestAction): string => {
    if (!request) {
      return "";
    }

    switch (action) {
      case "SUBMIT":
        return request.status === "REVISION_REQUIRED"
          ? "Pengajuan akan diajukan ulang dan kembali masuk ke antrean review Finance."
          : "Pengajuan akan dikirim ke Finance untuk direview.";

      case "START_REVIEW":
        return "Status pengajuan akan berubah menjadi Sedang Direview dan hanya Finance Reviewer yang dapat menentukan keputusan berikutnya.";

      case "APPROVE":
        return "Pengajuan akan disetujui. Backend juga akan membuat Surat Persetujuan secara otomatis sebelum status final disimpan.";

      default:
        return "";
    }
  };

  return {
    pendingAction,
    setPendingAction,
    reviewDialogType,
    setReviewDialogType,
    paymentDialogOpen,
    setPaymentDialogOpen,
    actionError,
    isProcessing,
    handleAction,
    handleConfirmAction,
    handleReviewConfirm,
    handlePaymentConfirm,
    getActionDescription,
  };
}
