import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  getUserById,
  getUserForRole,
} from "@/services/user.service";
import type { User, UserRole } from "@/types";

const USER_STORAGE_KEY = "frms-dev-user-id";
const LEGACY_ROLE_STORAGE_KEY = "frms-dev-role";

const USER_ROLES: UserRole[] = [
  "UNIT_USER",
  "FINANCE_REVIEWER",
  "FINANCE_PAYMENT",
  "ADMIN",
];

interface SessionContextValue {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (userId: string) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const SessionContext =
  createContext<SessionContextValue | null>(null);

function isUserRole(value: string | null): value is UserRole {
  if (!value) return false;

  return USER_ROLES.includes(value as UserRole);
}

export function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Sinkronisasi mock session dari localStorage setelah aplikasi berjalan di browser.
  useEffect(() => {
    const storedUserId =
      window.localStorage.getItem(USER_STORAGE_KEY);

    if (storedUserId) {
      const storedUser = getUserById(storedUserId);

      if (storedUser?.active) {
        setUserId(storedUser.id);
        setIsHydrated(true);
        return;
      }

      window.localStorage.removeItem(USER_STORAGE_KEY);
    }

    const legacyRole =
      window.localStorage.getItem(LEGACY_ROLE_STORAGE_KEY);

    if (isUserRole(legacyRole)) {
      const migratedUser = getUserForRole(legacyRole);

      setUserId(migratedUser.id);
      window.localStorage.setItem(
        USER_STORAGE_KEY,
        migratedUser.id,
      );
      window.localStorage.removeItem(
        LEGACY_ROLE_STORAGE_KEY,
      );
    }

    setIsHydrated(true);
  }, []);

  const user = useMemo(() => {
    if (!userId) return null;

    const currentUser = getUserById(userId);

    if (!currentUser?.active) return null;

    return currentUser;
  }, [userId]);

  const login = useCallback((nextUserId: string) => {
    const nextUser = getUserById(nextUserId);

    if (!nextUser) {
      throw new Error(
        "Pengguna mock tidak ditemukan.",
      );
    }

    if (!nextUser.active) {
      throw new Error(
        "Pengguna mock sedang tidak aktif.",
      );
    }

    setUserId(nextUser.id);

    window.localStorage.setItem(
      USER_STORAGE_KEY,
      nextUser.id,
    );
  }, []);

  const logout = useCallback(() => {
    setUserId(null);

    window.localStorage.removeItem(USER_STORAGE_KEY);
    window.localStorage.removeItem(
      LEGACY_ROLE_STORAGE_KEY,
    );
  }, []);

  const setRole = useCallback(
    (nextRole: UserRole) => {
      const nextUser = getUserForRole(nextRole);

      login(nextUser.id);
    },
    [login],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isHydrated,
      login,
      logout,
      setRole,
    }),
    [
      user,
      isHydrated,
      login,
      logout,
      setRole,
    ],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error(
      "useSession harus dipakai di dalam SessionProvider",
    );
  }

  return context;
}