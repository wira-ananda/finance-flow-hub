import { saveMockSettings } from "@/data/repositories/mock-settings.repository";
import type { SystemSettings, User } from "@/types";

export function updateSystemSettings(actor: User, settings: SystemSettings): SystemSettings {
  if (actor.role !== "ADMIN") {
    throw new Error("Hanya Administrator yang dapat mengubah pengaturan sistem.");
  }

  return saveMockSettings({
    ...settings,
  });
}
