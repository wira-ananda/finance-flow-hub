import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateRequestQueries } from "@/lib/api/query-invalidation";
import { processPayment, type ProcessPaymentInput } from "@/services/payment.service";

import type { User } from "@/types";

/**
 * Memproses pembayaran dan menyegarkan list/detail request setelah berhasil.
 */
export function usePaymentMutation(user: User | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, input }: { requestId: string; input: ProcessPaymentInput }) => {
      if (!user) {
        throw new Error("Session pengguna tidak tersedia.");
      }

      return processPayment(user, requestId, input);
    },

    onSuccess: async (_request, variables) => {
      if (!user) {
        return;
      }

      await invalidateRequestQueries(queryClient, user.id, variables.requestId);
    },
  });
}
