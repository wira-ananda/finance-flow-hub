import { DEFAULT_USER_BY_ROLE, MOCK_USERS } from "@/data/mock/users";
import { MOCK_BUSINESS_UNITS } from "@/data/mock/business-units";
import type { BusinessUnit, User, UserRole } from "@/types";

export function listUsers(): User[] {
  return MOCK_USERS;
}

export function listBusinessUnits(): BusinessUnit[] {
  return MOCK_BUSINESS_UNITS;
}

/** Mock session: mengembalikan pengguna default untuk role terpilih. */
export function getUserForRole(role: UserRole): User {
  const id = DEFAULT_USER_BY_ROLE[role];
  return MOCK_USERS.find((user) => user.id === id) ?? MOCK_USERS[0];
}

export function getBusinessUnit(id: string | null): BusinessUnit | undefined {
  if (!id) return undefined;
  return MOCK_BUSINESS_UNITS.find((unit) => unit.id === id);
}
