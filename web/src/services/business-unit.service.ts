import { apiGet } from "@/lib/api/client";

import { mapApiBusinessUnit } from "@/lib/api/mappers";

import type { ApiBusinessUnitRecord } from "@/types/finance-api";

import type { BusinessUnit } from "@/types";

export interface BusinessUnitInput {
  code: string;
  name: string;

  costCenter: string;

  managerName: string;
}

/**
 * Mengambil seluruh Unit Bisnis dari Finance API.
 */
export async function fetchBusinessUnits(signal?: AbortSignal): Promise<BusinessUnit[]> {
  const records = await apiGet<ApiBusinessUnitRecord[]>("business-units.list", {}, signal);

  return records.map(mapApiBusinessUnit).sort((a, b) => a.name.localeCompare(b.name, "id"));
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
