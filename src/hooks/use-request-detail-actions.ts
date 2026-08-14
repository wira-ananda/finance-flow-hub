import { useState } from "react";

import type { RequestAction } from "@/lib/permissions";
import { processPayment } from "@/services/payment.service";
import type { ProcessPaymentInput } from "@/services/payment.service";
import {
  approveRequest,
  rejectRequest,
  requestRevision,
  startReview,
} from "@/services/review.service";
import { submitRequest } from "@/services/request-write.service";
import type { FinanceRequest, User } from "@/types";

export type ReviewDialogType = "revision" | "reject";

interface UseRequestDetailActionsOptions {
  user: User | null;
  request: FinanceRequest | undefined;
}

export function useRequestDetailActions({ user, request }: UseRequestDetailActionsOptions) {
  const [pendingAction, setPendingAction] = useState<RequestAction | null>(null);

  const [reviewDialog, setReviewDialog] = useState<ReviewDialogType | null>(null);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = (action: RequestAction) => {
    if (!request) return;

    setActionError(null);

    if (action === "EDIT") {
      window.location.assign(`/pengajuan/baru?edit=${request.id}`);
      return;
    }

    if (action === "REQUEST_REVISION") {
      setReviewDialog("revision");
      return;
    }

    if (action === "REJECT") {
      setReviewDialog("reject");
      return;
    }

    if (action === "PROCESS_PAYMENT") {
      setPaymentDialogOpen(true);
      return;
    }

    setPendingAction(action);
  };

  const handleConfirmAction = (): boolean => {
    if (!user || !request || !pendingAction || isProcessing) {
      return false;
    }

    setActionError(null);
    setIsProcessing(true);

    try {
      switch (pendingAction) {
        case "SUBMIT":
          submitRequest(user, request.id);
          break;

        case "START_REVIEW":
          startReview(user, request.id);
          break;

        case "APPROVE":
          approveRequest(user, request.id);
          break;

        default:
          return false;
      }

      setPendingAction(null);
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Aksi gagal diproses.");

      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReviewDecision = (note: string): boolean => {
    if (!user || !request || !reviewDialog) {
      return false;
    }

    setActionError(null);
    setIsProcessing(true);

    try {
      if (reviewDialog === "revision") {
        requestRevision(user, request.id, note);
      } else {
        rejectRequest(user, request.id, note);
      }

      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Keputusan review gagal diproses.");

      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = (input: ProcessPaymentInput): boolean => {
    if (!user || !request) {
      return false;
    }

    setActionError(null);
    setIsProcessing(true);

    try {
      processPayment(user, request.id, input);
      setPaymentDialogOpen(false);

      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Pembayaran gagal diproses.");

      return false;
    } finally {
      setIsProcessing(false);
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
        return "Status pengajuan akan berubah menjadi Sedang Direview.";

      case "APPROVE":
        return "Pengajuan akan disetujui dan Surat Persetujuan akan dibuat secara otomatis.";

      default:
        return "Konfirmasi aksi pada pengajuan ini.";
    }
  };

  return {
    pendingAction,
    setPendingAction,
    reviewDialog,
    setReviewDialog,
    paymentDialogOpen,
    setPaymentDialogOpen,
    actionError,
    isProcessing,
    handleAction,
    handleConfirmAction,
    handleReviewDecision,
    handlePayment,
    getActionDescription,
  };
}
