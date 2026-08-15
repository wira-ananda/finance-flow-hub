import { apiGet } from "@/lib/api/client";

import { mapApiUser } from "@/lib/api/mappers";

import type { ApiUserRecord } from "@/types/finance-api";

import type { BusinessUnit, User, UserRole } from "@/types";

export interface UserInput {
  name: string;
  email: string;
  role: UserRole;
  jobTitle: string;

  businessUnitId: string | null;
}

/**
 * Mengambil seluruh pengguna dari Finance API.
 */
export async function fetchUsers(signal?: AbortSignal): Promise<User[]> {
  const records = await apiGet<ApiUserRecord[]>("users.list", {}, signal);

  return records.map(mapApiUser).sort((a, b) => a.name.localeCompare(b.name, "id"));
}

/**
 * Mengambil user berdasarkan ID dari data yang sudah tersedia di client.
 */
export function getUserById(users: User[], id: string): User | undefined {
  return users.find((user) => user.id === id);
}

/**
 * Mengambil seluruh user aktif berdasarkan status user dan Unit Bisnisnya.
 */
export function listActiveUsers(users: User[], units: BusinessUnit[]): User[] {
  const activeUnitIds = new Set(units.filter((unit) => unit.active).map((unit) => unit.id));

  return users.filter((user) => {
    if (!user.active) {
      return false;
    }

    if (user.role !== "UNIT_USER") {
      return true;
    }

    return Boolean(user.businessUnitId && activeUnitIds.has(user.businessUnitId));
  });
}

/**
 * Mengambil user aktif default untuk Development Role Switcher.
 */
export function getUserForRole(users: User[], units: BusinessUnit[], role: UserRole): User {
  const activeUsers = listActiveUsers(users, units).filter((user) => user.role === role);

  const preferredIds: Partial<Record<UserRole, string>> = {
    UNIT_USER: "usr-01",

    FINANCE_REVIEWER: "usr-03",

    FINANCE_PAYMENT: "usr-04",

    ADMIN: "usr-05",
  };

  const preferred = activeUsers.find((user) => user.id === preferredIds[role]);

  if (preferred) {
    return preferred;
  }

  const fallback = activeUsers[0];

  if (!fallback) {
    throw new Error(`Tidak ada pengguna aktif untuk role ${role}.`);
  }

  return fallback;
}
