import type { QueryClient } from "@tanstack/react-query";

import { financeQueryKeys } from "@/lib/api/query-keys";

/**
 * Menandai cache list dan detail request sebagai stale setelah mutation request berhasil.
 */
export async function invalidateRequestQueries(
  queryClient: QueryClient,
  userId: string,
  requestId?: string,
): Promise<void> {
  const tasks: Promise<unknown>[] = [
    queryClient.invalidateQueries({
      queryKey: financeQueryKeys.requests.list(userId),
    }),
  ];

  if (requestId) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: financeQueryKeys.requests.detail(userId, requestId),
      }),
    );
  }

  await Promise.all(tasks);
}
