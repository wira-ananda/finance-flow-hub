import { QueryClient } from "@tanstack/react-query";

/**
 * Membuat cache server-state Finance API untuk satu instance aplikasi/router.
 */
export function createFinanceQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
