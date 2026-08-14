import {
  getMockBusinessUnitSnapshot,
  insertMockBusinessUnit,
  updateMockBusinessUnit,
} from "@/data/repositories/mock-business-unit.repository";
import { getMockUserSnapshot } from "@/data/repositories/mock-user.repository";
import type { BusinessUnit, User } from "@/types";

export interface BusinessUnitInput {
  code: string;
  name: string;
  costCenter: string;
  managerName: string;
}

function assertAdmin(actor: User): void {
  if (actor.role !== "ADMIN" || !actor.active) {
    throw new Error("Hanya Administrator aktif yang dapat mengelola Unit Bisnis.");
  }
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function validateInput(input: BusinessUnitInput, currentUnitId?: string): void {
  if (
    !input.code.trim() ||
    !input.name.trim() ||
    !input.costCenter.trim() ||
    !input.managerName.trim()
  ) {
    throw new Error("Seluruh informasi Unit Bisnis wajib diisi.");
  }

  const units = getMockBusinessUnitSnapshot();

  const code = normalizeCode(input.code);

  const costCenter = normalizeCode(input.costCenter);

  const duplicateCode = units.some(
    (unit) => unit.id !== currentUnitId && normalizeCode(unit.code) === code,
  );

  if (duplicateCode) {
    throw new Error("Kode Unit Bisnis sudah digunakan.");
  }

  const duplicateCostCenter = units.some(
    (unit) => unit.id !== currentUnitId && normalizeCode(unit.costCenter) === costCenter,
  );

  if (duplicateCostCenter) {
    throw new Error("Cost Center sudah digunakan Unit Bisnis lain.");
  }
}

export function listBusinessUnits(): BusinessUnit[] {
  return [...getMockBusinessUnitSnapshot()];
}

export function listActiveBusinessUnits(): BusinessUnit[] {
  return getMockBusinessUnitSnapshot().filter((unit) => unit.active);
}

export function getBusinessUnit(id: string | null): BusinessUnit | undefined {
  if (!id) {
    return undefined;
  }

  return getMockBusinessUnitSnapshot().find((unit) => unit.id === id);
}

export function createBusinessUnit(actor: User, input: BusinessUnitInput): BusinessUnit {
  assertAdmin(actor);
  validateInput(input);

  return insertMockBusinessUnit({
    id: `bu-${Date.now()}`,
    code: normalizeCode(input.code),
    name: input.name.trim(),
    costCenter: normalizeCode(input.costCenter),
    managerName: input.managerName.trim(),
    active: true,
  });
}

export function updateBusinessUnit(
  actor: User,
  unitId: string,
  input: BusinessUnitInput,
): BusinessUnit {
  assertAdmin(actor);

  const existing = getBusinessUnit(unitId);

  if (!existing) {
    throw new Error("Unit Bisnis tidak ditemukan.");
  }

  validateInput(input, unitId);

  const updated = updateMockBusinessUnit(unitId, (unit) => ({
    ...unit,
    code: normalizeCode(input.code),
    name: input.name.trim(),
    costCenter: normalizeCode(input.costCenter),
    managerName: input.managerName.trim(),
  }));

  if (!updated) {
    throw new Error("Gagal memperbarui Unit Bisnis.");
  }

  return updated;
}

export function setBusinessUnitActive(actor: User, unitId: string, active: boolean): BusinessUnit {
  assertAdmin(actor);

  const existing = getBusinessUnit(unitId);

  if (!existing) {
    throw new Error("Unit Bisnis tidak ditemukan.");
  }

  if (!active) {
    const activeUsers = getMockUserSnapshot().filter(
      (user) => user.active && user.businessUnitId === unitId,
    );

    if (activeUsers.length > 0) {
      throw new Error("Nonaktifkan atau pindahkan pengguna aktif pada unit ini terlebih dahulu.");
    }
  }

  const updated = updateMockBusinessUnit(unitId, (unit) => ({
    ...unit,
    active,
  }));

  if (!updated) {
    throw new Error("Gagal mengubah status Unit Bisnis.");
  }

  return updated;
}
