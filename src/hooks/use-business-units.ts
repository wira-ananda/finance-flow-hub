import { useSyncExternalStore } from "react";

import {
  getMockBusinessUnitServerSnapshot,
  getMockBusinessUnitSnapshot,
  subscribeMockBusinessUnits,
} from "@/data/repositories/mock-business-unit.repository";

export function useBusinessUnits() {
  return useSyncExternalStore(
    subscribeMockBusinessUnits,
    getMockBusinessUnitSnapshot,
    getMockBusinessUnitServerSnapshot,
  );
}
