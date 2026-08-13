import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { getUserForRole } from "@/services/user.service";
import type { User, UserRole } from "@/types";

/**
 * Mock session provider. Tidak ada authentication sungguhan pada tahap ini —
 * role dipilih melalui Development Role Switcher.
 */

const ROLE_STORAGE_KEY = "frms-dev-role";

interface SessionContextValue {
  role: UserRole;
  user: User;
  setRole: (role: UserRole) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("UNIT_USER");

  useEffect(() => {
    const stored = window.localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    if (stored) setRoleState(stored);
  }, []);

  const setRole = useCallback((next: UserRole) => {
    setRoleState(next);
    window.localStorage.setItem(ROLE_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ role, user: getUserForRole(role), setRole }),
    [role, setRole],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession harus dipakai di dalam SessionProvider");
  return context;
}
