import { MOCK_BUSINESS_UNITS } from "@/data/mock/business-units";
import type { BusinessUnit } from "@/types";

const STORAGE_KEY = "frms-mock-business-units-v1";

type Listener = () => void;

const listeners = new Set<Listener>();

function cloneUnits(units: BusinessUnit[]): BusinessUnit[] {
  return units.map((unit) => ({
    ...unit,
    active: unit.active ?? true,
  }));
}

const serverSnapshot = cloneUnits(MOCK_BUSINESS_UNITS);

let browserSnapshot: BusinessUnit[] | null = null;

function readUnits(): BusinessUnit[] {
  if (typeof window === "undefined") {
    return serverSnapshot;
  }

  if (browserSnapshot) {
    return browserSnapshot;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    browserSnapshot = cloneUnits(MOCK_BUSINESS_UNITS);

    return browserSnapshot;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      throw new Error("Format mock Unit Bisnis tidak valid.");
    }

    browserSnapshot = cloneUnits(parsed as BusinessUnit[]);

    return browserSnapshot;
  } catch {
    browserSnapshot = cloneUnits(MOCK_BUSINESS_UNITS);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(browserSnapshot));

    return browserSnapshot;
  }
}

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

function persistUnits(units: BusinessUnit[]): void {
  browserSnapshot = cloneUnits(units);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(browserSnapshot));
  }

  emitChange();
}

export function getMockBusinessUnitSnapshot(): BusinessUnit[] {
  return readUnits();
}

export function getMockBusinessUnitServerSnapshot(): BusinessUnit[] {
  return serverSnapshot;
}

export function subscribeMockBusinessUnits(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function insertMockBusinessUnit(unit: BusinessUnit): BusinessUnit {
  persistUnits([...getMockBusinessUnitSnapshot(), unit]);

  return unit;
}

export function updateMockBusinessUnit(
  unitId: string,
  updater: (unit: BusinessUnit) => BusinessUnit,
): BusinessUnit | undefined {
  const current = getMockBusinessUnitSnapshot();

  const existing = current.find((unit) => unit.id === unitId);

  if (!existing) {
    return undefined;
  }

  const updated = updater(existing);

  persistUnits(current.map((unit) => (unit.id === unitId ? updated : unit)));

  return updated;
}

export function resetMockBusinessUnits(): void {
  persistUnits(cloneUnits(MOCK_BUSINESS_UNITS));
}
