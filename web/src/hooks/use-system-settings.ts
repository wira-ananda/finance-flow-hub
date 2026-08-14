import { useSyncExternalStore } from "react";

import {
  getMockSettingsServerSnapshot,
  getMockSettingsSnapshot,
  subscribeMockSettings,
} from "@/data/repositories/mock-settings.repository";

export function useSystemSettings() {
  return useSyncExternalStore(
    subscribeMockSettings,
    getMockSettingsSnapshot,
    getMockSettingsServerSnapshot,
  );
}
