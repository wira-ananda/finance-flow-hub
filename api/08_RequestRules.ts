type UserRole = "UNIT_USER" | "FINANCE_REVIEWER" | "FINANCE_PAYMENT" | "ADMIN";

type RequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "REVISION_REQUIRED"
  | "REJECTED"
  | "APPROVED"
  | "PAID";

type RequestCategory =
  | "OPERASIONAL"
  | "PENGADAAN"
  | "PERJALANAN_DINAS"
  | "REIMBURSEMENT"
  | "PEMASARAN";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  business_unit_id: string;
  role: UserRole;
  job_title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FinancialRequestRecord {
  id: string;
  request_number: string;
  business_unit_id: string;
  requested_by: string;
  title: string;
  description: string;
  category: RequestCategory;
  amount: number;
  status: RequestStatus;
  beneficiary_name: string;
  beneficiary_bank: string;
  beneficiary_account: string;
  needed_at: string;
  submitted_at: string;
  approved_at: string;
  approved_by: string;
  paid_at: string;
  created_at: string;
  updated_at: string;
}

interface RequestHistoryRecord {
  id: string;
  request_id: string;
  actor_id: string;
  action: string;
  previous_status: string;
  new_status: string;
  notes: string;
  created_at: string;
}

interface RequestReviewRecord {
  id: string;
  request_id: string;
  reviewer_id: string;
  action: string;
  notes: string;
  created_at: string;
}

interface RequestPaymentRecord {
  id: string;
  request_id: string;
  amount: number;
  payment_date: string;
  reference_number: string;
  proof_file_id: string;
  proof_file_url: string;
  processed_by: string;
  processed_at: string;
}

const REQUEST_STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: ["SUBMITTED"],

  SUBMITTED: ["UNDER_REVIEW"],

  UNDER_REVIEW: ["REVISION_REQUIRED", "REJECTED", "APPROVED"],

  REVISION_REQUIRED: ["SUBMITTED"],

  REJECTED: [],

  APPROVED: ["PAID"],

  PAID: [],
};

function createEntityId(prefix: string): string {
  return `${prefix}-${Utilities.getUuid()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createDomainError(message: string, code: string): Error {
  const error = new Error(message);

  (
    error as Error & {
      code?: string;
    }
  ).code = code;

  return error;
}

function getErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String(
      (
        error as {
          code?: unknown;
        }
      ).code ?? "INTERNAL_ERROR",
    );
  }

  return "INTERNAL_ERROR";
}

function assertStatusTransition(
  currentStatus: RequestStatus,
  nextStatus: RequestStatus,
): void {
  const allowed = REQUEST_STATUS_TRANSITIONS[currentStatus];

  if (!allowed.includes(nextStatus)) {
    throw createDomainError(
      `Perubahan status ${currentStatus} ke ${nextStatus} tidak diizinkan.`,
      "INVALID_STATUS_TRANSITION",
    );
  }
}

function assertActiveActor(actor: UserRecord): void {
  if (!normalizeBoolean(actor.is_active)) {
    throw createDomainError("Pengguna sedang tidak aktif.", "USER_INACTIVE");
  }
}

function assertActorRole(actor: UserRecord, role: UserRole): void {
  assertActiveActor(actor);

  if (actor.role !== role) {
    throw createDomainError(
      `Aksi ini hanya dapat dilakukan oleh role ${role}.`,
      "FORBIDDEN",
    );
  }
}

function canActorViewRequest(
  actor: UserRecord,
  request: FinancialRequestRecord,
): boolean {
  if (!normalizeBoolean(actor.is_active)) {
    return false;
  }

  switch (actor.role) {
    case "UNIT_USER":
      return actor.business_unit_id === request.business_unit_id;

    case "FINANCE_REVIEWER":
      return request.status !== "DRAFT";

    case "FINANCE_PAYMENT":
      return ["APPROVED", "PAID"].includes(request.status);

    case "ADMIN":
      return true;
  }
}

function assertCanViewRequest(
  actor: UserRecord,
  request: FinancialRequestRecord,
): void {
  if (!canActorViewRequest(actor, request)) {
    throw createDomainError(
      "Pengajuan tidak ditemukan atau tidak dapat Anda akses.",
      "REQUEST_NOT_FOUND",
    );
  }
}

function assertRequestOwner(
  actor: UserRecord,
  request: FinancialRequestRecord,
): void {
  assertActorRole(actor, "UNIT_USER");

  if (request.requested_by !== actor.id) {
    throw createDomainError(
      "Pengajuan hanya dapat diubah oleh pemohon.",
      "FORBIDDEN",
    );
  }
}

function assertEditableRequest(
  actor: UserRecord,
  request: FinancialRequestRecord,
): void {
  assertRequestOwner(actor, request);

  if (!["DRAFT", "REVISION_REQUIRED"].includes(request.status)) {
    throw createDomainError(
      "Pengajuan dengan status ini tidak dapat diubah.",
      "REQUEST_NOT_EDITABLE",
    );
  }
}

function assertSubmittableRequest(request: FinancialRequestRecord): void {
  const missing: string[] = [];

  if (!request.title.trim()) {
    missing.push("title");
  }

  if (!request.description.trim()) {
    missing.push("description");
  }

  if (Number(request.amount) <= 0) {
    missing.push("amount");
  }

  if (!request.category) {
    missing.push("category");
  }

  if (!request.beneficiary_name.trim()) {
    missing.push("beneficiary_name");
  }

  if (!request.beneficiary_bank.trim()) {
    missing.push("beneficiary_bank");
  }

  if (!request.beneficiary_account.trim()) {
    missing.push("beneficiary_account");
  }

  if (!request.needed_at) {
    missing.push("needed_at");
  }

  if (missing.length > 0) {
    throw createDomainError(
      `Data pengajuan belum lengkap: ${missing.join(", ")}.`,
      "VALIDATION_ERROR",
    );
  }
}
