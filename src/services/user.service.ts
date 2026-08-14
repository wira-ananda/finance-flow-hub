import {
  DEFAULT_USER_BY_ROLE,
  MOCK_USERS,
} from "@/data/mock/users";
import { MOCK_BUSINESS_UNITS } from "@/data/mock/business-units";
import type {
  BusinessUnit,
  User,
  UserRole,
} from "@/types";

/**
 * Mengambil seluruh mock user.
 */
export function listUsers(): User[] {
  return [...MOCK_USERS];
}

/**
 * Mengambil mock user yang masih aktif.
 */
export function listActiveUsers(): User[] {
  return MOCK_USERS.filter((user) => user.active);
}

/**
 * Mengambil user berdasarkan ID.
 */
export function getUserById(
  id: string,
): User | undefined {
  return MOCK_USERS.find((user) => user.id === id);
}

/**
 * Mengambil seluruh mock unit bisnis.
 */
export function listBusinessUnits(): BusinessUnit[] {
  return [...MOCK_BUSINESS_UNITS];
}

/**
 * Mengambil pengguna default untuk role tertentu.
 * Digunakan oleh Development Role Switcher.
 */
export function getUserForRole(
  role: UserRole,
): User {
  const id = DEFAULT_USER_BY_ROLE[role];

  const user = MOCK_USERS.find(
    (item) => item.id === id,
  );

  if (!user) {
    throw new Error(
      `Mock user untuk role ${role} tidak ditemukan.`,
    );
  }

  return user;
}

/**
 * Mengambil unit bisnis berdasarkan ID.
 */
export function getBusinessUnit(
  id: string | null,
): BusinessUnit | undefined {
  if (!id) return undefined;

  return MOCK_BUSINESS_UNITS.find(
    (unit) => unit.id === id,
  );
}