import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { financeQueryKeys } from "@/lib/api/query-keys";

import {
  createUser,
  fetchUsers,
  setUserActive,
  updateUser,
  type UserInput,
} from "@/services/user.service";

import type { User } from "@/types";

export type UserCommand =
  | {
      type: "CREATE";

      input: UserInput;
    }
  | {
      type: "UPDATE";

      userId: string;

      input: UserInput;
    }
  | {
      type: "SET_ACTIVE";

      userId: string;

      isActive: boolean;
    };

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
 * Menjalankan mutation master pengguna dan menyegarkan cache pengguna/request setelah sukses.
 */
export function useUserMutation(user: User | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: UserCommand) => {
      if (!user) {
        throw new Error("Session pengguna tidak tersedia.");
      }

      switch (command.type) {
        case "CREATE":
          return createUser(user, command.input);

        case "UPDATE":
          return updateUser(user, command.userId, command.input);

        case "SET_ACTIVE":
          return setUserActive(user, command.userId, command.isActive);
      }
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: financeQueryKeys.users.all,
        }),

        queryClient.invalidateQueries({
          queryKey: financeQueryKeys.requests.root,
        }),
      ]);
    },
  });
}

/**
 * Compatibility helper untuk component yang hanya membutuhkan array user.
 */
export function useUsers() {
  return useUsersQuery().data ?? [];
}
