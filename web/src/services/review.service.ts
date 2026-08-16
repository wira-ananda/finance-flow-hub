import { apiPost } from "@/lib/api/client";
import { mapApiFinancialRequest } from "@/lib/api/mappers";

import type { FinanceRequest, User } from "@/types";
import type { ApiFinancialRequestRecord } from "@/types/finance-api";

interface ReviewBaseBody extends Record<string, unknown> {
  actorId: string;
  id: string;
}

interface RevisionBody extends ReviewBaseBody {
  notes: string;
}

interface RejectBody extends ReviewBaseBody {
  reason: string;
}

/**
 * Memulai proses review untuk request berstatus SUBMITTED.
 */
export async function startReview(user: User, requestId: string): Promise<FinanceRequest> {
  const record = await apiPost<ApiFinancialRequestRecord, ReviewBaseBody>("reviews.start", {
    actorId: user.id,
    id: requestId,
  });

  return mapApiFinancialRequest(record, [user]);
}

/**
 * Mengembalikan request kepada Unit Bisnis untuk direvisi.
 */
export async function requestRevision(
  user: User,
  requestId: string,
  notes: string,
): Promise<FinanceRequest> {
  const cleanNotes = notes.trim();

  if (!cleanNotes) {
    throw new Error("Catatan revisi wajib diisi.");
  }

  const record = await apiPost<ApiFinancialRequestRecord, RevisionBody>("reviews.revision", {
    actorId: user.id,
    id: requestId,
    notes: cleanNotes,
  });

  return mapApiFinancialRequest(record, [user]);
}

/**
 * Menolak request yang sedang berada dalam proses review.
 */
export async function rejectRequest(
  user: User,
  requestId: string,
  reason: string,
): Promise<FinanceRequest> {
  const cleanReason = reason.trim();

  if (!cleanReason) {
    throw new Error("Alasan penolakan wajib diisi.");
  }

  const record = await apiPost<ApiFinancialRequestRecord, RejectBody>("reviews.reject", {
    actorId: user.id,
    id: requestId,
    reason: cleanReason,
  });

  return mapApiFinancialRequest(record, [user]);
}

/**
 * Menyetujui request dan memicu pembuatan Surat Persetujuan di backend.
 */
export async function approveRequest(user: User, requestId: string): Promise<FinanceRequest> {
  const record = await apiPost<ApiFinancialRequestRecord, ReviewBaseBody>("reviews.approve", {
    actorId: user.id,
    id: requestId,
  });

  return mapApiFinancialRequest(record, [user]);
}
