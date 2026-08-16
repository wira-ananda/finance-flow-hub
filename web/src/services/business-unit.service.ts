import { apiGet, apiPost } from "@/lib/api/client";

import { mapApiBusinessUnit } from "@/lib/api/mappers";

import type { ApiBusinessUnitRecord } from "@/types/finance-api";

import type { BusinessUnit, User } from "@/types";

export interface BusinessUnitInput {
  code: string;

  name: string;

  costCenter: string;

  managerName: string;
}

interface BusinessUnitMutationBody extends Record<string, unknown> {
  actorId: string;

  unit: BusinessUnitInput;
}

interface BusinessUnitUpdateBody extends BusinessUnitMutationBody {
  id: string;
}

interface BusinessUnitActiveBody extends Record<string, unknown> {
  actorId: string;

  id: string;

  isActive: boolean;
}

function assertAdminUser(user: User): void {
  if (user.role !== "ADMIN" || !user.active) {
    throw new Error("Hanya Administrator aktif yang dapat mengelola Unit Bisnis.");
  }
}

function normalizeBusinessUnitInput(input: BusinessUnitInput): BusinessUnitInput {
  return {
    code: input.code.trim().toUpperCase(),

    name: input.name.trim(),

    costCenter: input.costCenter.trim(),

    managerName: input.managerName.trim(),
  };
}

/**
 * Mengambil seluruh Unit Bisnis dari Finance API.
 */
export async function fetchBusinessUnits(signal?: AbortSignal): Promise<BusinessUnit[]> {
  const records = await apiGet<ApiBusinessUnitRecord[]>("business-units.list", {}, signal);

  return records.map(mapApiBusinessUnit).sort((a, b) => a.name.localeCompare(b.name, "id"));
}

/**
 * Membuat Unit Bisnis baru melalui Finance API.
 */
export async function createBusinessUnit(
  actor: User,
  input: BusinessUnitInput,
): Promise<BusinessUnit> {
  assertAdminUser(actor);

  const record = await apiPost<ApiBusinessUnitRecord, BusinessUnitMutationBody>(
    "business-units.create",
    {
      actorId: actor.id,

      unit: normalizeBusinessUnitInput(input),
    },
  );

  return mapApiBusinessUnit(record);
}

/**
 * Memperbarui master Unit Bisnis melalui Finance API.
 */
export async function updateBusinessUnit(
  actor: User,
  businessUnitId: string,
  input: BusinessUnitInput,
): Promise<BusinessUnit> {
  assertAdminUser(actor);

  const record = await apiPost<ApiBusinessUnitRecord, BusinessUnitUpdateBody>(
    "business-units.update",
    {
      actorId: actor.id,

      id: businessUnitId,

      unit: normalizeBusinessUnitInput(input),
    },
  );

  return mapApiBusinessUnit(record);
}

/**
 * Mengaktifkan atau menonaktifkan Unit Bisnis tanpa menghapus histori referensinya.
 */
export async function setBusinessUnitActive(
  actor: User,
  businessUnitId: string,
  isActive: boolean,
): Promise<BusinessUnit> {
  assertAdminUser(actor);

  const record = await apiPost<ApiBusinessUnitRecord, BusinessUnitActiveBody>(
    "business-units.set-active",
    {
      actorId: actor.id,

      id: businessUnitId,

      isActive,
    },
  );

  return mapApiBusinessUnit(record);
}

/**
 * Mengambil satu Unit Bisnis dari data yang sudah tersedia di client.
 */
export function getBusinessUnit(
  units: BusinessUnit[],
  id: string | null,
): BusinessUnit | undefined {
  if (!id) {
    return undefined;
  }

  return units.find((unit) => unit.id === id);
}

/**
 * Mengambil Unit Bisnis yang masih aktif.
 */
export function listActiveBusinessUnits(units: BusinessUnit[]): BusinessUnit[] {
  return units.filter((unit) => unit.active);
}
