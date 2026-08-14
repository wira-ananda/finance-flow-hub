import {
  getMockRequestSnapshot,
  insertMockRequest,
  updateMockRequest,
} from "@/data/repositories/mock-request.repository";
import { canPerform } from "@/lib/permissions";
import { assertRequestStatusTransition } from "@/lib/request-status";
import { getRequest } from "@/services/request.service";
import type {
  ActivityAction,
  FinanceRequest,
  RequestCategory,
  RequestDocument,
  User,
} from "@/types";

export interface RequestAttachmentInput {
  id?: string;
  name: string;
  sizeKb: number;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface CreateRequestInput {
  title: string;
  description: string;
  category: RequestCategory;
  amount: number;
  beneficiaryName: string;
  beneficiaryBank: string;
  beneficiaryAccount: string;
  neededAt: string;
  attachments?: RequestAttachmentInput[];
}

export interface UpdateRequestInput {
  title?: string;
  description?: string;
  category?: RequestCategory;
  amount?: number;
  beneficiaryName?: string;
  beneficiaryBank?: string;
  beneficiaryAccount?: string;
  neededAt?: string;
  attachments?: RequestAttachmentInput[];
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeNeededAt(value: string): string {
  if (!value || value.includes("T")) {
    return value;
  }

  return `${value}T00:00:00Z`;
}

function getNextRequestNumber(requests: FinanceRequest[]): string {
  const year = new Date().getFullYear();

  const highestNumber = requests.reduce((highest, request) => {
    const match = request.requestNumber.match(/^REQ-\d{4}-(\d+)$/);

    if (!match) {
      return highest;
    }

    return Math.max(highest, Number(match[1]));
  }, 0);

  return `REQ-${year}-${String(highestNumber + 1).padStart(4, "0")}`;
}

function createAttachmentDocuments(
  attachments: RequestAttachmentInput[],
  user: User,
): RequestDocument[] {
  return attachments.map((attachment) => ({
    id: attachment.id ?? createId("doc"),
    name: attachment.name,
    type: "LAMPIRAN",
    sizeKb: attachment.sizeKb,
    uploadedAt: attachment.uploadedAt ?? nowIso(),
    uploadedBy: attachment.uploadedBy ?? user.name,
  }));
}

function assertUnitUser(user: User): asserts user is User & { businessUnitId: string } {
  if (user.role !== "UNIT_USER" || !user.active || !user.businessUnitId) {
    throw new Error("Hanya pengguna Unit Bisnis aktif yang dapat membuat pengajuan.");
  }
}

function validateSubmittableRequest(request: FinanceRequest): void {
  const missingFields: string[] = [];

  if (!request.title.trim()) missingFields.push("judul pengajuan");
  if (!request.description.trim()) missingFields.push("deskripsi");
  if (request.amount <= 0) missingFields.push("nominal");
  if (!request.neededAt) missingFields.push("tanggal kebutuhan dana");
  if (!request.beneficiaryName.trim()) missingFields.push("nama penerima");
  if (!request.beneficiaryBank.trim()) missingFields.push("bank penerima");
  if (!request.beneficiaryAccount.trim()) missingFields.push("nomor rekening");

  if (missingFields.length > 0) {
    throw new Error(`Lengkapi ${missingFields.join(", ")} sebelum pengajuan dikirim.`);
  }
}

function getEditableRequest(user: User, requestId: string): FinanceRequest {
  const request = getRequest(user, requestId);

  if (!request) {
    throw new Error("Pengajuan tidak ditemukan atau tidak dapat Anda akses.");
  }

  return request;
}

function createRequest(
  user: User,
  input: CreateRequestInput,
  initialStatus: "DRAFT" | "SUBMITTED",
): FinanceRequest {
  assertUnitUser(user);

  const createdAt = nowIso();

  const request: FinanceRequest = {
    id: createId("req"),
    requestNumber: getNextRequestNumber(getMockRequestSnapshot()),
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    amount: input.amount,
    status: initialStatus,
    businessUnitId: user.businessUnitId,
    requesterId: user.id,
    beneficiaryName: input.beneficiaryName.trim(),
    beneficiaryBank: input.beneficiaryBank.trim(),
    beneficiaryAccount: input.beneficiaryAccount.trim(),
    neededAt: normalizeNeededAt(input.neededAt),
    createdAt,
    updatedAt: createdAt,
    paidAt: null,
    payment: null,
    documents: createAttachmentDocuments(input.attachments ?? [], user),
    activities: [
      {
        id: createId("act"),
        action: "CREATED",
        actorName: user.name,
        actorRole: user.role,
        createdAt,
      },
    ],
  };

  if (initialStatus === "SUBMITTED") {
    validateSubmittableRequest(request);

    request.activities.push({
      id: createId("act"),
      action: "SUBMITTED",
      actorName: user.name,
      actorRole: user.role,
      createdAt,
    });
  }

  return insertMockRequest(request);
}

export function saveDraftRequest(user: User, input: CreateRequestInput): FinanceRequest {
  return createRequest(user, input, "DRAFT");
}

export function createAndSubmitRequest(user: User, input: CreateRequestInput): FinanceRequest {
  return createRequest(user, input, "SUBMITTED");
}

export function updateRequest(
  user: User,
  requestId: string,
  input: UpdateRequestInput,
): FinanceRequest {
  const existing = getEditableRequest(user, requestId);

  if (!canPerform(user, existing, "EDIT")) {
    throw new Error("Pengajuan ini tidak dapat diubah.");
  }

  const updated = updateMockRequest(requestId, (request) => {
    const officialDocuments = request.documents.filter((document) => document.type !== "LAMPIRAN");

    const supportingDocuments =
      input.attachments !== undefined
        ? createAttachmentDocuments(input.attachments, user)
        : request.documents.filter((document) => document.type === "LAMPIRAN");

    return {
      ...request,
      title: input.title !== undefined ? input.title.trim() : request.title,
      description: input.description !== undefined ? input.description.trim() : request.description,
      category: input.category ?? request.category,
      amount: input.amount ?? request.amount,
      beneficiaryName:
        input.beneficiaryName !== undefined
          ? input.beneficiaryName.trim()
          : request.beneficiaryName,
      beneficiaryBank:
        input.beneficiaryBank !== undefined
          ? input.beneficiaryBank.trim()
          : request.beneficiaryBank,
      beneficiaryAccount:
        input.beneficiaryAccount !== undefined
          ? input.beneficiaryAccount.trim()
          : request.beneficiaryAccount,
      neededAt: input.neededAt !== undefined ? normalizeNeededAt(input.neededAt) : request.neededAt,
      documents: [...supportingDocuments, ...officialDocuments],
      updatedAt: nowIso(),
    };
  });

  if (!updated) {
    throw new Error("Gagal memperbarui pengajuan.");
  }

  return updated;
}

export function submitRequest(user: User, requestId: string): FinanceRequest {
  const existing = getEditableRequest(user, requestId);

  if (!canPerform(user, existing, "SUBMIT")) {
    throw new Error("Pengajuan ini tidak dapat diajukan.");
  }

  validateSubmittableRequest(existing);
  assertRequestStatusTransition(existing.status, "SUBMITTED");

  const action: ActivityAction =
    existing.status === "REVISION_REQUIRED" ? "RESUBMITTED" : "SUBMITTED";

  const updated = updateMockRequest(requestId, (request) => {
    const timestamp = nowIso();

    return {
      ...request,
      status: "SUBMITTED",
      updatedAt: timestamp,
      activities: [
        ...request.activities,
        {
          id: createId("act"),
          action,
          actorName: user.name,
          actorRole: user.role,
          createdAt: timestamp,
        },
      ],
    };
  });

  if (!updated) {
    throw new Error("Gagal mengajukan pengajuan.");
  }

  return updated;
}
