import { updateMockRequest } from "@/data/repositories/mock-request.repository";
import { canPerform } from "@/lib/permissions";
import { assertRequestStatusTransition } from "@/lib/request-status";
import { getRequest } from "@/services/request.service";
import type { FinanceRequest, RequestDocument, User } from "@/types";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function getApprovalLetterNumber(request: FinanceRequest): string {
  const parts = request.requestNumber.split("-");
  const year = parts[1] ?? String(new Date().getFullYear());
  const sequence = parts[2] ?? "0001";

  return `SPR-${year}-${sequence}`;
}

function getReviewerRequest(user: User, requestId: string): FinanceRequest {
  const request = getRequest(user, requestId);

  if (!request) {
    throw new Error("Pengajuan tidak ditemukan atau tidak dapat Anda akses.");
  }

  return request;
}

export function startReview(user: User, requestId: string): FinanceRequest {
  const existing = getReviewerRequest(user, requestId);

  if (!canPerform(user, existing, "START_REVIEW")) {
    throw new Error("Pengajuan ini tidak dapat mulai direview.");
  }

  assertRequestStatusTransition(existing.status, "UNDER_REVIEW");

  const updated = updateMockRequest(requestId, (request) => {
    const timestamp = nowIso();

    return {
      ...request,
      status: "UNDER_REVIEW",
      updatedAt: timestamp,
      activities: [
        ...request.activities,
        {
          id: createId("act"),
          action: "REVIEW_STARTED",
          actorName: user.name,
          actorRole: user.role,
          createdAt: timestamp,
        },
      ],
    };
  });

  if (!updated) {
    throw new Error("Gagal memulai review.");
  }

  return updated;
}

export function requestRevision(user: User, requestId: string, notes: string): FinanceRequest {
  const cleanNotes = notes.trim();

  if (!cleanNotes) {
    throw new Error("Catatan revisi wajib diisi.");
  }

  const existing = getReviewerRequest(user, requestId);

  if (!canPerform(user, existing, "REQUEST_REVISION")) {
    throw new Error("Pengajuan ini tidak dapat diminta revisi.");
  }

  assertRequestStatusTransition(existing.status, "REVISION_REQUIRED");

  const updated = updateMockRequest(requestId, (request) => {
    const timestamp = nowIso();

    return {
      ...request,
      status: "REVISION_REQUIRED",
      updatedAt: timestamp,
      activities: [
        ...request.activities,
        {
          id: createId("act"),
          action: "REVISION_REQUESTED",
          actorName: user.name,
          actorRole: user.role,
          note: cleanNotes,
          createdAt: timestamp,
        },
      ],
    };
  });

  if (!updated) {
    throw new Error("Gagal meminta revisi.");
  }

  return updated;
}

export function rejectRequest(user: User, requestId: string, reason: string): FinanceRequest {
  const cleanReason = reason.trim();

  if (!cleanReason) {
    throw new Error("Alasan penolakan wajib diisi.");
  }

  const existing = getReviewerRequest(user, requestId);

  if (!canPerform(user, existing, "REJECT")) {
    throw new Error("Pengajuan ini tidak dapat ditolak.");
  }

  assertRequestStatusTransition(existing.status, "REJECTED");

  const updated = updateMockRequest(requestId, (request) => {
    const timestamp = nowIso();

    return {
      ...request,
      status: "REJECTED",
      updatedAt: timestamp,
      activities: [
        ...request.activities,
        {
          id: createId("act"),
          action: "REJECTED",
          actorName: user.name,
          actorRole: user.role,
          note: cleanReason,
          createdAt: timestamp,
        },
      ],
    };
  });

  if (!updated) {
    throw new Error("Gagal menolak pengajuan.");
  }

  return updated;
}

export function approveRequest(user: User, requestId: string): FinanceRequest {
  const existing = getReviewerRequest(user, requestId);

  if (!canPerform(user, existing, "APPROVE")) {
    throw new Error("Pengajuan ini tidak dapat disetujui.");
  }

  assertRequestStatusTransition(existing.status, "APPROVED");

  const updated = updateMockRequest(requestId, (request) => {
    const timestamp = nowIso();
    const documentNumber = getApprovalLetterNumber(request);

    const approvalDocument: RequestDocument = {
      id: createId("doc"),
      name: `Surat-Persetujuan-${request.requestNumber}.pdf`,
      type: "SURAT_PERSETUJUAN",
      documentNumber,
      sizeKb: 220,
      uploadedAt: timestamp,
      uploadedBy: user.name,
    };

    return {
      ...request,
      status: "APPROVED",
      updatedAt: timestamp,
      documents: [...request.documents, approvalDocument],
      activities: [
        ...request.activities,
        {
          id: createId("act"),
          action: "APPROVED",
          actorName: user.name,
          actorRole: user.role,
          createdAt: timestamp,
        },
        {
          id: createId("act"),
          action: "APPROVAL_LETTER_GENERATED",
          actorName: user.name,
          actorRole: user.role,
          note: `Surat Persetujuan ${documentNumber} dibuat secara otomatis.`,
          createdAt: timestamp,
        },
      ],
    };
  });

  if (!updated) {
    throw new Error("Gagal menyetujui pengajuan.");
  }

  return updated;
}
