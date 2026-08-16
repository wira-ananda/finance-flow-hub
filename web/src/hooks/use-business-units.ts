import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { financeQueryKeys } from "@/lib/api/query-keys";

import {
  createBusinessUnit,
  fetchBusinessUnits,
  setBusinessUnitActive,
  updateBusinessUnit,
  type BusinessUnitInput,
} from "@/services/business-unit.service";

import type { User } from "@/types";

export type BusinessUnitCommand =
  | {
      type: "CREATE";

      input: BusinessUnitInput;
    }
  | {
      type: "UPDATE";

      businessUnitId: string;

      input: BusinessUnitInput;
    }
  | {
      type: "SET_ACTIVE";

      businessUnitId: string;

      isActive: boolean;
    };

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
 * Menjalankan seluruh mutation master Unit Bisnis dan menyegarkan cache master setelah sukses.
 */
export function useBusinessUnitMutation(user: User | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: BusinessUnitCommand) => {
      if (!user) {
        throw new Error("Session pengguna tidak tersedia.");
      }

      switch (command.type) {
        case "CREATE":
          return createBusinessUnit(user, command.input);

        case "UPDATE":
          return updateBusinessUnit(user, command.businessUnitId, command.input);

        case "SET_ACTIVE":
          return setBusinessUnitActive(user, command.businessUnitId, command.isActive);
      }
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: financeQueryKeys.businessUnits.all,
      });
    },
  });
}

/**
 * Compatibility helper untuk component yang hanya membutuhkan array Unit Bisnis.
 */
export function useBusinessUnits() {
  return useBusinessUnitsQuery().data ?? [];
}
