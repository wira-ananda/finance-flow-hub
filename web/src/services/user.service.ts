import { apiGet, apiPost } from "@/lib/api/client";

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

interface UserMutationBody extends Record<string, unknown> {
  actorId: string;

  user: UserInput;
}

interface UserUpdateBody extends UserMutationBody {
  id: string;
}

interface UserActiveBody extends Record<string, unknown> {
  actorId: string;

  id: string;

  isActive: boolean;
}

function assertAdminUser(user: User): void {
  if (user.role !== "ADMIN" || !user.active) {
    throw new Error("Hanya Administrator aktif yang dapat mengelola pengguna.");
  }
}

function normalizeUserInput(input: UserInput): UserInput {
  return {
    name: input.name.trim(),

    email: input.email.trim().toLowerCase(),

    role: input.role,

    jobTitle: input.jobTitle.trim(),

    businessUnitId: input.role === "UNIT_USER" ? input.businessUnitId : null,
  };
}

/**
 * Mengambil seluruh pengguna dari Finance API.
 */
export async function fetchUsers(signal?: AbortSignal): Promise<User[]> {
  const records = await apiGet<ApiUserRecord[]>("users.list", {}, signal);

  return records.map(mapApiUser).sort((a, b) => a.name.localeCompare(b.name, "id"));
}

/**
 * Membuat pengguna baru yang diizinkan login memakai Google Account dengan email yang sama.
 */
export async function createUser(actor: User, input: UserInput): Promise<User> {
  assertAdminUser(actor);

  const record = await apiPost<ApiUserRecord, UserMutationBody>("users.create", {
    actorId: actor.id,

    user: normalizeUserInput(input),
  });

  return mapApiUser(record);
}

/**
 * Memperbarui identitas, role, jabatan, dan konteks Unit Bisnis pengguna.
 */
export async function updateUser(actor: User, userId: string, input: UserInput): Promise<User> {
  assertAdminUser(actor);

  const record = await apiPost<ApiUserRecord, UserUpdateBody>("users.update", {
    actorId: actor.id,

    id: userId,

    user: normalizeUserInput(input),
  });

  return mapApiUser(record);
}

/**
 * Mengaktifkan atau menonaktifkan akses pengguna tanpa menghapus histori referensinya.
 */
export async function setUserActive(actor: User, userId: string, isActive: boolean): Promise<User> {
  assertAdminUser(actor);

  const record = await apiPost<ApiUserRecord, UserActiveBody>("users.set-active", {
    actorId: actor.id,

    id: userId,

    isActive,
  });

  return mapApiUser(record);
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
 * Compatibility helper lama untuk development data. Akan dibersihkan pada Step 7I.
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
