import { useQuery } from "@tanstack/react-query";

import { financeQueryKeys } from "@/lib/api/query-keys";

import { fetchBusinessUnits } from "@/services/business-unit.service";

/**
 * Query master Unit Bisnis dari Finance API.
 */
export function useBusinessUnitsQuery() {
  return useQuery({
    queryKey: financeQueryKeys.businessUnits.all,

    queryFn: ({ signal }) => fetchBusinessUnits(signal),

    enabled: typeof window !== "undefined",

    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Compatibility helper untuk component yang hanya membutuhkan array Unit Bisnis.
 */
export function useBusinessUnits() {
  return useBusinessUnitsQuery().data ?? [];
}
