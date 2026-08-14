import { REQUEST_STATUS_TRANSITIONS, STATUS_LABELS } from "@/constants/status";
import type { RequestStatus } from "@/types";

/**
 * Memeriksa apakah perpindahan status request diizinkan oleh workflow.
 */
export function canTransitionRequestStatus(
  currentStatus: RequestStatus,
  nextStatus: RequestStatus,
): boolean {
  return REQUEST_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

/**
 * Menghentikan proses ketika perpindahan status tidak sesuai workflow.
 */
export function assertRequestStatusTransition(
  currentStatus: RequestStatus,
  nextStatus: RequestStatus,
): void {
  if (canTransitionRequestStatus(currentStatus, nextStatus)) {
    return;
  }

  throw new Error(
    `Status ${STATUS_LABELS[currentStatus]} tidak dapat diubah menjadi ${STATUS_LABELS[nextStatus]}.`,
  );
}
