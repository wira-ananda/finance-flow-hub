import { resetMockBusinessUnits } from "@/data/repositories/mock-business-unit.repository";
import { resetMockRequests } from "@/data/repositories/mock-request.repository";
import { resetMockSettings } from "@/data/repositories/mock-settings.repository";
import { resetMockUsers } from "@/data/repositories/mock-user.repository";
import type { User } from "@/types";

/**
 * Mengembalikan seluruh mock business data ke seed awal.
 *
 * Theme, sidebar preference, dan session development
 * tidak ikut dihapus.
 */
export function resetDevelopmentData(actor: User): void {
  if (actor.role !== "ADMIN" || !actor.active) {
    throw new Error("Hanya Administrator aktif yang dapat mereset data development.");
  }

  resetMockRequests();
  resetMockBusinessUnits();
  resetMockUsers();
  resetMockSettings();
}
