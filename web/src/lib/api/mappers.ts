import type {
  ActivityAction,
  ActivityEntry,
  BusinessUnit,
  FinanceRequest,
  RequestDocument,
  RequestPayment,
  User,
  UserRole,
} from "@/types";
import type {
  ApiBusinessUnitRecord,
  ApiFinancialRequestRecord,
  ApiRequestDetail,
  ApiRequestHistoryRecord,
  ApiRequestReviewRecord,
  ApiUserRecord,
} from "@/types/finance-api";

const HISTORY_ACTION_ALIASES: Record<string, ActivityAction> = {
  CREATED: "CREATED",
  REQUEST_CREATED: "CREATED",
  SUBMITTED: "SUBMITTED",
  REQUEST_SUBMITTED: "SUBMITTED",
  RESUBMITTED: "RESUBMITTED",
  REQUEST_RESUBMITTED: "RESUBMITTED",
  REVIEW_STARTED: "REVIEW_STARTED",
  START_REVIEW: "REVIEW_STARTED",
  REVISION_REQUESTED: "REVISION_REQUESTED",
  REVISION_REQUIRED: "REVISION_REQUESTED",
  REQUEST_REVISION: "REVISION_REQUESTED",
  REJECTED: "REJECTED",
  REJECT: "REJECTED",
  APPROVED: "APPROVED",
  APPROVE: "APPROVED",
  PAID: "PAID",
  PAYMENT_PROCESSED: "PAID",
  COMMENT: "COMMENT",
};

/**
 * Mengubah value sheet/API menjadi boolean frontend yang konsisten.
 */
function normalizeBoolean(value: boolean | string | number): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return ["true", "1", "yes", "aktif"].includes(value.trim().toLowerCase());
}

/**
 * Membuat initials maksimal dua karakter dari nama pengguna.
 */
function createInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Mengubah User DTO dari Apps Script ke model UI.
 */
export function mapApiUser(record: ApiUserRecord): User {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    jobTitle: record.job_title,
    businessUnitId: record.business_unit_id || null,
    initials: createInitials(record.name),
    active: normalizeBoolean(record.is_active),
  };
}

/**
 * Mengubah Business Unit DTO dari Apps Script ke model UI.
 */
export function mapApiBusinessUnit(record: ApiBusinessUnitRecord): BusinessUnit {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    costCenter: record.cost_center,
    managerName: record.manager_name,
    active: normalizeBoolean(record.is_active),
  };
}

function getUserMap(users: User[]): Map<string, User> {
  return new Map(users.map((user) => [user.id, user]));
}

function getActor(
  usersById: Map<string, User>,
  actorId: string,
  fallbackRole: UserRole,
): Pick<ActivityEntry, "actorId" | "actorName" | "actorRole"> {
  const actor = usersById.get(actorId);

  return {
    ...(actorId
      ? {
          actorId,
        }
      : {}),
    actorName: actor?.name ?? (actorId || "-"),
    actorRole: actor?.role ?? fallbackRole,
  };
}

function createBaseActivities(record: ApiFinancialRequestRecord, users: User[]): ActivityEntry[] {
  const usersById = getUserMap(users);

  const activities: ActivityEntry[] = [
    {
      id: `${record.id}-created`,
      action: "CREATED",
      ...getActor(usersById, record.requested_by, "UNIT_USER"),
      createdAt: record.created_at,
    },
  ];

  if (record.submitted_at) {
    activities.push({
      id: `${record.id}-submitted`,
      action: "SUBMITTED",
      ...getActor(usersById, record.requested_by, "UNIT_USER"),
      createdAt: record.submitted_at,
    });
  }

  if (record.approved_at) {
    activities.push({
      id: `${record.id}-approved`,
      action: "APPROVED",
      ...getActor(usersById, record.approved_by, "FINANCE_REVIEWER"),
      createdAt: record.approved_at,
    });
  }

  if (record.paid_at) {
    activities.push({
      id: `${record.id}-paid`,
      action: "PAID",
      actorName: "Finance Payment",
      actorRole: "FINANCE_PAYMENT",
      createdAt: record.paid_at,
    });
  }

  return activities.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/**
 * Mengubah satu request DTO menjadi model UI untuk list/dashboard.
 */
export function mapApiFinancialRequest(
  record: ApiFinancialRequestRecord,
  users: User[] = [],
): FinanceRequest {
  return {
    id: record.id,
    requestNumber: record.request_number,
    title: record.title,
    description: record.description,
    category: record.category,
    amount: Number(record.amount) || 0,
    status: record.status,
    businessUnitId: record.business_unit_id,
    requesterId: record.requested_by,
    beneficiaryName: record.beneficiary_name,
    beneficiaryBank: record.beneficiary_bank,
    beneficiaryAccount: record.beneficiary_account,
    neededAt: record.needed_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    paidAt: record.paid_at || null,
    payment: null,
    documents: [],
    activities: createBaseActivities(record, users),
  };
}

function mapHistoryActivity(
  history: ApiRequestHistoryRecord,
  usersById: Map<string, User>,
): ActivityEntry | null {
  const normalizedAction = history.action.trim().toUpperCase();

  const action = HISTORY_ACTION_ALIASES[normalizedAction];

  if (!action) {
    return null;
  }

  let fallbackRole: UserRole = "UNIT_USER";

  if (["REVIEW_STARTED", "REVISION_REQUESTED", "REJECTED", "APPROVED"].includes(action)) {
    fallbackRole = "FINANCE_REVIEWER";
  }

  if (action === "PAID") {
    fallbackRole = "FINANCE_PAYMENT";
  }

  return {
    id: history.id,
    action,
    ...getActor(usersById, history.actor_id, fallbackRole),
    ...(history.notes
      ? {
          note: history.notes,
        }
      : {}),
    createdAt: history.created_at,
  };
}

function mapReviewActivity(
  review: ApiRequestReviewRecord,
  usersById: Map<string, User>,
): ActivityEntry | null {
  const reviewActionAliases: Record<string, ActivityAction> = {
    START_REVIEW: "REVIEW_STARTED",
    REVIEW_STARTED: "REVIEW_STARTED",
    REQUEST_REVISION: "REVISION_REQUESTED",
    REVISION_REQUESTED: "REVISION_REQUESTED",
    REJECT: "REJECTED",
    REJECTED: "REJECTED",
    APPROVE: "APPROVED",
    APPROVED: "APPROVED",
  };

  const action = reviewActionAliases[review.action.trim().toUpperCase()];

  if (!action) {
    return null;
  }

  return {
    id: review.id,
    action,
    ...getActor(usersById, review.reviewer_id, "FINANCE_REVIEWER"),
    ...(review.notes
      ? {
          note: review.notes,
        }
      : {}),
    createdAt: review.created_at,
  };
}

function getDetailPayments(detail: ApiRequestDetail) {
  if (detail.payments) {
    return detail.payments;
  }

  return detail.payment ? [detail.payment] : [];
}

function mapDetailDocuments(
  detail: ApiRequestDetail,
  usersById: Map<string, User>,
): RequestDocument[] {
  const attachments = detail.attachments ?? [];

  const requestDocuments = detail.documents ?? [];

  const payments = getDetailPayments(detail);

  const documents: RequestDocument[] = attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.file_name,
    type: "LAMPIRAN",
    sizeKb: Number(attachment.size_kb) || 0,
    uploadedAt: attachment.created_at,
    uploadedBy: usersById.get(attachment.uploaded_by)?.name ?? attachment.uploaded_by ?? "-",
    fileUrl: attachment.file_url,
  }));

  requestDocuments.forEach((document) => {
    documents.push({
      id: document.id,
      name: document.file_name,
      type: "SURAT_PERSETUJUAN",
      documentNumber: document.document_number,
      sizeKb: Number(document.size_kb) || 0,
      uploadedAt: document.generated_at,
      uploadedBy: usersById.get(document.generated_by)?.name ?? document.generated_by ?? "-",
      fileUrl: document.file_url,
    });
  });

  payments.forEach((payment) => {
    if (!payment.proof_file_id && !payment.proof_file_url) {
      return;
    }

    documents.push({
      id: `payment-proof-${payment.id}`,
      name: payment.proof_file_name || `Bukti-Transfer-${detail.request.request_number}`,
      type: "BUKTI_TRANSFER",
      sizeKb: Number(payment.proof_size_kb) || 0,
      uploadedAt: payment.processed_at,
      uploadedBy: usersById.get(payment.processed_by)?.name ?? payment.processed_by ?? "-",
      fileUrl: payment.proof_file_url,
    });
  });

  return documents.sort(
    (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
  );
}

function mapLatestPayment(detail: ApiRequestDetail): RequestPayment | null {
  const latest = [...getDetailPayments(detail)].sort(
    (a, b) => new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime(),
  )[0];

  if (!latest) {
    return null;
  }

  return {
    amount: Number(latest.amount) || 0,
    paymentDate: latest.payment_date,
    referenceNumber: latest.reference_number,
    processedBy: latest.processed_by,
    processedAt: latest.processed_at,
    ...(latest.proof_file_url
      ? {
          proofFileUrl: latest.proof_file_url,
        }
      : {}),
  };
}

/**
 * Mengubah response detail request menjadi model UI lengkap.
 */
export function mapApiRequestDetail(detail: ApiRequestDetail, users: User[] = []): FinanceRequest {
  const request = mapApiFinancialRequest(detail.request, users);

  const usersById = getUserMap(users);

  const histories = detail.histories ?? detail.history ?? [];

  const requestDocuments = detail.documents ?? [];

  const historyActivities = histories
    .map((history) => mapHistoryActivity(history, usersById))
    .filter((activity): activity is ActivityEntry => activity !== null);

  const reviewActivities = (detail.reviews ?? [])
    .map((review) => mapReviewActivity(review, usersById))
    .filter((activity): activity is ActivityEntry => activity !== null);

  const approvalActivities: ActivityEntry[] = requestDocuments
    .filter((document) => document.document_type === "SURAT_PERSETUJUAN")
    .map((document) => ({
      id: `${document.id}-generated`,
      action: "APPROVAL_LETTER_GENERATED",
      ...getActor(usersById, document.generated_by, "FINANCE_REVIEWER"),
      note: document.document_number
        ? `Surat Persetujuan ${document.document_number} dibuat secara otomatis.`
        : "Surat Persetujuan dibuat secara otomatis.",
      createdAt: document.generated_at,
    }));

  const activities =
    historyActivities.length > 0
      ? [...historyActivities, ...approvalActivities]
      : [...request.activities, ...reviewActivities, ...approvalActivities];

  activities.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return {
    ...request,
    payment: mapLatestPayment(detail),
    documents: mapDetailDocuments(detail, usersById),
    activities,
  };
}
