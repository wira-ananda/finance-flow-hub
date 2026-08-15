import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { financeQueryKeys } from "@/lib/api/query-keys";

import { getCurrentSessionUserFn, logoutFn } from "@/lib/auth/auth.functions";

import type { User, UserRole } from "@/types";

interface SessionContextValue {
  user: User | null;

  role: UserRole | null;

  isAuthenticated: boolean;

  isHydrated: boolean;

  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: financeQueryKeys.session.current,

    queryFn: () => getCurrentSessionUserFn(),

    staleTime: 5 * 60 * 1000,

    retry: false,

    refetchOnWindowFocus: false,
  });

  const user = sessionQuery.data ?? null;

  const logout = useCallback(async () => {
    await logoutFn();

    queryClient.clear();

    /*
     * Full navigation sengaja dilakukan pada auth boundary
     * supaya seluruh memory/cache user sebelumnya benar-benar hilang.
     */
    window.location.assign("/login");
  }, [queryClient]);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,

      role: user?.role ?? null,

      isAuthenticated: Boolean(user),

      isHydrated: !sessionQuery.isPending,

      logout,
    }),
    [user, sessionQuery.isPending, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession harus dipakai di dalam SessionProvider");
  }

  return context;
}
