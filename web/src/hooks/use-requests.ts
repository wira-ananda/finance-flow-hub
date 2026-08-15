import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { financeQueryKeys } from "@/lib/api/query-keys";

import { useUsersQuery } from "@/hooks/use-users";

import {
  createAndSubmitRequest,
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
 * Mutation create request. submitNow menentukan DRAFT atau langsung SUBMITTED.
 */
export function useCreateRequestMutation(user: User) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      submitNow,
    }: {
      input: CreateRequestInput;

      submitNow: boolean;
    }) => (submitNow ? createAndSubmitRequest(user, input) : saveDraftRequest(user, input)),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: financeQueryKeys.requests.root,
      });
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

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: financeQueryKeys.requests.list(user.id),
        }),

        queryClient.invalidateQueries({
          queryKey: financeQueryKeys.requests.detail(user.id, variables.requestId),
        }),
      ]);
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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: financeQueryKeys.requests.list(user?.id ?? ""),
        }),

        queryClient.invalidateQueries({
          queryKey: financeQueryKeys.requests.detail(user?.id ?? "", requestId),
        }),
      ]);
    },
  });
}
