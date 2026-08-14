import { getMockBusinessUnitSnapshot } from "@/data/repositories/mock-business-unit.repository";
import {
  getMockUserSnapshot,
  insertMockUser,
  updateMockUser,
} from "@/data/repositories/mock-user.repository";
import { DEFAULT_USER_BY_ROLE } from "@/data/mock/users";
import type { User, UserRole } from "@/types";

export interface UserInput {
  name: string;
  email: string;
  role: UserRole;
  jobTitle: string;
  businessUnitId: string | null;
}

function assertAdmin(actor: User): void {
  if (actor.role !== "ADMIN" || !actor.active) {
    throw new Error("Hanya Administrator aktif yang dapat mengelola pengguna.");
  }
}

function createInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateUserInput(input: UserInput, currentUserId?: string): void {
  if (!input.name.trim()) {
    throw new Error("Nama pengguna wajib diisi.");
  }

  if (!input.email.trim()) {
    throw new Error("Email wajib diisi.");
  }

  if (!input.jobTitle.trim()) {
    throw new Error("Jabatan wajib diisi.");
  }

  const duplicateEmail = getMockUserSnapshot().some(
    (user) =>
      user.id !== currentUserId && normalizeEmail(user.email) === normalizeEmail(input.email),
  );

  if (duplicateEmail) {
    throw new Error("Email sudah digunakan pengguna lain.");
  }

  if (input.role !== "UNIT_USER") {
    return;
  }

  if (!input.businessUnitId) {
    throw new Error("Unit Bisnis wajib dipilih untuk pengguna Unit Bisnis.");
  }

  const unit = getMockBusinessUnitSnapshot().find((item) => item.id === input.businessUnitId);

  if (!unit || !unit.active) {
    throw new Error("Unit Bisnis tidak tersedia atau sedang nonaktif.");
  }
}

/**
 * Mengambil seluruh user dari mock repository.
 */
export function listUsers(): User[] {
  return [...getMockUserSnapshot()];
}

/**
 * Mengambil user aktif.
 *
 * UNIT_USER pada unit nonaktif dianggap tidak memiliki akses aktif.
 */
export function listActiveUsers(): User[] {
  const units = getMockBusinessUnitSnapshot();

  return getMockUserSnapshot().filter((user) => {
    if (!user.active) {
      return false;
    }

    if (user.role !== "UNIT_USER") {
      return true;
    }

    return units.some((unit) => unit.id === user.businessUnitId && unit.active);
  });
}

/**
 * Mengambil user berdasarkan ID.
 */
export function getUserById(id: string): User | undefined {
  return getMockUserSnapshot().find((user) => user.id === id);
}

/**
 * Mengambil user aktif default untuk Development Role Switcher.
 */
export function getUserForRole(role: UserRole): User {
  const defaultId = DEFAULT_USER_BY_ROLE[role];

  const users = listActiveUsers();

  const defaultUser = users.find((user) => user.id === defaultId && user.role === role);

  if (defaultUser) {
    return defaultUser;
  }

  const fallbackUser = users.find((user) => user.role === role);

  if (!fallbackUser) {
    throw new Error(`Tidak ada pengguna aktif untuk role ${role}.`);
  }

  return fallbackUser;
}

export function createUser(actor: User, input: UserInput): User {
  assertAdmin(actor);
  validateUserInput(input);

  const user: User = {
    id: `usr-${Date.now()}`,
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    role: input.role,
    jobTitle: input.jobTitle.trim(),
    businessUnitId: input.role === "UNIT_USER" ? input.businessUnitId : null,
    initials: createInitials(input.name),
    active: true,
  };

  return insertMockUser(user);
}

export function updateUser(actor: User, userId: string, input: UserInput): User {
  assertAdmin(actor);

  const existing = getUserById(userId);

  if (!existing) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  if (existing.id === actor.id && input.role !== "ADMIN") {
    throw new Error("Administrator aktif tidak dapat mengubah role dirinya sendiri.");
  }

  validateUserInput(input, userId);

  const updated = updateMockUser(userId, (user) => ({
    ...user,
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    role: input.role,
    jobTitle: input.jobTitle.trim(),
    businessUnitId: input.role === "UNIT_USER" ? input.businessUnitId : null,
    initials: createInitials(input.name),
  }));

  if (!updated) {
    throw new Error("Gagal memperbarui pengguna.");
  }

  return updated;
}

export function setUserActive(actor: User, userId: string, active: boolean): User {
  assertAdmin(actor);

  const existing = getUserById(userId);

  if (!existing) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  if (existing.id === actor.id && !active) {
    throw new Error("Anda tidak dapat menonaktifkan akun Administrator yang sedang digunakan.");
  }

  if (active && existing.role === "UNIT_USER") {
    const unit = getMockBusinessUnitSnapshot().find((item) => item.id === existing.businessUnitId);

    if (!unit || !unit.active) {
      throw new Error("Pengguna tidak dapat diaktifkan karena Unit Bisnisnya sedang nonaktif.");
    }
  }

  if (!active) {
    const remainingUsers = listActiveUsers().filter(
      (user) => user.role === existing.role && user.id !== existing.id,
    );

    if (remainingUsers.length === 0) {
      throw new Error(
        "Minimal satu pengguna aktif harus tersedia untuk setiap role selama development.",
      );
    }
  }

  const updated = updateMockUser(userId, (user) => ({
    ...user,
    active,
  }));

  if (!updated) {
    throw new Error("Gagal mengubah status pengguna.");
  }

  return updated;
}

/**
 * Compatibility export untuk file lama yang masih mengimpor
 * helper Unit Bisnis dari user.service.
 */
export { getBusinessUnit, listBusinessUnits } from "@/services/business-unit.service";
