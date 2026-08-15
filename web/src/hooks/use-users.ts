import { useQuery } from "@tanstack/react-query";

import { financeQueryKeys } from "@/lib/api/query-keys";

import { fetchUsers } from "@/services/user.service";

/**
 * Query master pengguna dari Finance API.
 */
export function useUsersQuery() {
  return useQuery({
    queryKey: financeQueryKeys.users.all,

    queryFn: ({ signal }) => fetchUsers(signal),

    enabled: typeof window !== "undefined",

    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Compatibility helper untuk component yang hanya membutuhkan array user.
 */
export function useUsers() {
  return useUsersQuery().data ?? [];
}
