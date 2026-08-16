import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useUsersQuery } from "@/hooks/use-users";
import { invalidateRequestQueries } from "@/lib/api/query-invalidation";
import { financeQueryKeys } from "@/lib/api/query-keys";
import {
  saveDraftRequest,
  submitRequest,
  updateRequest,
  type CreateRequestInput,
  type UpdateRequestInput,
} from "@/services/request-write.service";
import { fetchRequestDetail, fetchRequests } from "@/services/request.service";

import type { User } from "@/types";

/**
 * Query daftar request sesuai permission actor.
 */
export function useRequestsQuery(user: User | null) {
  const usersQuery = useUsersQuery();

  return useQuery({
    queryKey: financeQueryKeys.requests.list(user?.id ?? ""),

    queryFn: ({ signal }) => fetchRequests(user!.id, usersQuery.data ?? [], signal),

    enabled: Boolean(user && usersQuery.data),

    staleTime: 20 * 1000,
  });
}

/**
 * Query satu request lengkap.
 */
export function useRequestQuery(user: User | null, requestId: string | null) {
  const usersQuery = useUsersQuery();

  return useQuery({
    queryKey: financeQueryKeys.requests.detail(user?.id ?? "", requestId ?? ""),

    queryFn: ({ signal }) =>
      fetchRequestDetail(user!.id, requestId!, usersQuery.data ?? [], signal),

    enabled: Boolean(user && requestId && usersQuery.data),

    staleTime: 10 * 1000,
  });
}

/**
 * Membuat DRAFT baru. Workflow submit selalu membuat draft lebih dulu agar attachment dapat diunggah
 * sebelum status berubah menjadi SUBMITTED.
 */
export function useCreateRequestMutation(user: User) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input }: { input: CreateRequestInput; refresh?: boolean }) =>
      saveDraftRequest(user, input),

    onSuccess: async (_request, variables) => {
      if (variables.refresh === false) {
        return;
      }

      await invalidateRequestQueries(queryClient, user.id);
    },
  });
}

/**
 * Mutation update request.
 */
export function useUpdateRequestMutation(user: User) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      input,
    }: {
      requestId: string;
      input: UpdateRequestInput;
      refresh?: boolean;
    }) => updateRequest(user, requestId, input),

    onSuccess: async (_request, variables) => {
      if (variables.refresh === false) {
        return;
      }

      await invalidateRequestQueries(queryClient, user.id, variables.requestId);
    },
  });
}

/**
 * Mutation submit atau resubmit request.
 */
export function useSubmitRequestMutation(user: User | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => {
      if (!user) {
        throw new Error("Session pengguna tidak tersedia.");
      }

      return submitRequest(user, requestId);
    },

    onSuccess: async (_request, requestId) => {
      if (!user) {
        return;
      }

      await invalidateRequestQueries(queryClient, user.id, requestId);
    },
  });
}
