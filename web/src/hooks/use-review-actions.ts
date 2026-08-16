import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateRequestQueries } from "@/lib/api/query-invalidation";
import {
  approveRequest,
  rejectRequest,
  requestRevision,
  startReview,
} from "@/services/review.service";

import type { User } from "@/types";

export type ReviewCommand =
  | {
      type: "START_REVIEW";
      requestId: string;
    }
  | {
      type: "REQUEST_REVISION";
      requestId: string;
      notes: string;
    }
  | {
      type: "REJECT";
      requestId: string;
      reason: string;
    }
  | {
      type: "APPROVE";
      requestId: string;
    };

/**
 * Menjalankan mutation review dan menyegarkan cache request yang terdampak.
 */
export function useReviewMutation(user: User | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: ReviewCommand) => {
      if (!user) {
        throw new Error("Session pengguna tidak tersedia.");
      }

      switch (command.type) {
        case "START_REVIEW":
          return startReview(user, command.requestId);

        case "REQUEST_REVISION":
          return requestRevision(user, command.requestId, command.notes);

        case "REJECT":
          return rejectRequest(user, command.requestId, command.reason);

        case "APPROVE":
          return approveRequest(user, command.requestId);
      }
    },

    onSuccess: async (_request, command) => {
      if (!user) {
        return;
      }

      await invalidateRequestQueries(queryClient, user.id, command.requestId);
    },
  });
}
