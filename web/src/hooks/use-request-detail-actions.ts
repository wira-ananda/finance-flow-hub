import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { useSubmitRequestMutation } from "@/hooks/use-requests";

import type { RequestAction } from "@/lib/permissions";

import type { FinanceRequest, User } from "@/types";

interface UseRequestDetailActionsOptions {
  user: User | null;

  request: FinanceRequest | undefined;
}

/**
 * Aksi detail yang sudah terhubung sampai Step 7D.
 * Review dan pembayaran sengaja tidak berada di hook ini sampai Step 7E/7G.
 */
export function useRequestDetailActions({ user, request }: UseRequestDetailActionsOptions) {
  const navigate = useNavigate();

  const [pendingAction, setPendingAction] = useState<RequestAction | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const submitMutation = useSubmitRequestMutation(user);

  const handleAction = (action: RequestAction) => {
    if (!request) {
      return;
    }

    setActionError(null);

    if (action === "EDIT") {
      void navigate({
        to: "/pengajuan/baru",

        search: {
          edit: request.id,
        },
      });

      return;
    }

    if (action === "SUBMIT") {
      setPendingAction(action);
    }
  };

  const handleConfirmAction = async (): Promise<boolean> => {
    if (!request || pendingAction !== "SUBMIT" || submitMutation.isPending) {
      return false;
    }

    setActionError(null);

    try {
      await submitMutation.mutateAsync(request.id);

      setPendingAction(null);

      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Pengajuan gagal diajukan.");

      return false;
    }
  };

  const getActionDescription = (action: RequestAction): string => {
    if (!request || action !== "SUBMIT") {
      return "";
    }

    return request.status === "REVISION_REQUIRED"
      ? "Pengajuan akan diajukan ulang dan kembali masuk ke antrean review Finance."
      : "Pengajuan akan dikirim ke Finance untuk direview.";
  };

  return {
    pendingAction,
    setPendingAction,
    actionError,

    isProcessing: submitMutation.isPending,

    handleAction,
    handleConfirmAction,
    getActionDescription,
  };
}
