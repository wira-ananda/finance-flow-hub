import { MOCK_BUSINESS_UNITS } from "@/data/mock/business-units";
import { MOCK_USERS } from "@/data/mock/users";
import {
  getMockRequestSnapshot,
  insertMockRequest,
  updateMockRequest,
} from "@/data/repositories/mock-request.repository";
import { REQUEST_STATUS_TRANSITIONS } from "@/constants/status";
import {
  canPerform,
  canViewRequest,
} from "@/lib/permissions";
import { formatRupiahCompact } from "@/lib/formatters";
import type {
  ActivityAction,
  DashboardStat,
  FinanceRequest,
  RequestCategory,
  RequestDocument,
  RequestStatus,
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

function createId(
  prefix: string,
): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function getNextRequestNumber(
  requests: FinanceRequest[],
): string {
  const year =
    new Date().getFullYear();

  const highestNumber =
    requests.reduce(
      (
        highest,
        request,
      ) => {
        const match =
          request.requestNumber.match(
            /^REQ-\d{4}-(\d+)$/,
          );

        if (!match) {
          return highest;
        }

        return Math.max(
          highest,
          Number(match[1]),
        );
      },
      0,
    );

  return `REQ-${year}-${String(
    highestNumber + 1,
  ).padStart(4, "0")}`;
}

function normalizeNeededAt(
  value: string,
): string {
  if (!value) {
    return "";
  }

  if (
    value.includes("T")
  ) {
    return value;
  }

  return `${value}T00:00:00Z`;
}

function createAttachmentDocuments(
  attachments: RequestAttachmentInput[],
  user: User,
): RequestDocument[] {
  return attachments.map(
    (attachment) => ({
      id:
        attachment.id ??
        createId("doc"),

      name:
        attachment.name,

      type:
        "LAMPIRAN",

      sizeKb:
        attachment.sizeKb,

      uploadedAt:
        attachment.uploadedAt ??
        nowIso(),

      uploadedBy:
        attachment.uploadedBy ??
        user.name,
    }),
  );
}

function assertUnitUser(
  user: User,
): asserts user is User & {
  businessUnitId: string;
} {
  if (
    user.role !==
      "UNIT_USER" ||
    !user.active ||
    !user.businessUnitId
  ) {
    throw new Error(
      "Hanya pengguna Unit Bisnis aktif yang dapat membuat pengajuan.",
    );
  }
}

function validateSubmittableRequest(
  request: FinanceRequest,
) {
  const missing: string[] =
    [];

  if (
    !request.title.trim()
  ) {
    missing.push(
      "judul pengajuan",
    );
  }

  if (
    !request.description.trim()
  ) {
    missing.push(
      "deskripsi",
    );
  }

  if (
    request.amount <= 0
  ) {
    missing.push(
      "nominal",
    );
  }

  if (!request.neededAt) {
    missing.push(
      "tanggal kebutuhan dana",
    );
  }

  if (
    !request.beneficiaryName.trim()
  ) {
    missing.push(
      "nama penerima",
    );
  }

  if (
    !request.beneficiaryBank.trim()
  ) {
    missing.push(
      "bank penerima",
    );
  }

  if (
    !request.beneficiaryAccount.trim()
  ) {
    missing.push(
      "nomor rekening",
    );
  }

  if (
    missing.length > 0
  ) {
    throw new Error(
      `Lengkapi ${missing.join(", ")} sebelum pengajuan dikirim.`,
    );
  }
}

function assertStatusTransition(
  current:
    RequestStatus,
  next:
    RequestStatus,
) {
  if (
    !REQUEST_STATUS_TRANSITIONS[
      current
    ].includes(next)
  ) {
    throw new Error(
      `Perubahan status ${current} ke ${next} tidak diizinkan.`,
    );
  }
}

/**
 * Mengambil seluruh request yang dapat diakses user.
 */
export function listRequests(
  user: User,
  source:
    FinanceRequest[] =
    getMockRequestSnapshot(),
): FinanceRequest[] {
  return source
    .filter(
      (request) =>
        canViewRequest(
          user,
          request,
        ),
    )
    .sort(
      (a, b) =>
        new Date(
          b.updatedAt,
        ).getTime() -
        new Date(
          a.updatedAt,
        ).getTime(),
    );
}

/**
 * Mengambil request berdasarkan status.
 */
export function listRequestsByStatus(
  user: User,
  statuses: RequestStatus[],
  source:
    FinanceRequest[] =
    getMockRequestSnapshot(),
): FinanceRequest[] {
  return listRequests(
    user,
    source,
  ).filter(
    (request) =>
      statuses.includes(
        request.status,
      ),
  );
}

/**
 * Mengambil satu request berdasarkan ID dan permission.
 */
export function getRequest(
  user: User,
  id: string,
  source:
    FinanceRequest[] =
    getMockRequestSnapshot(),
): FinanceRequest | undefined {
  const request =
    source.find(
      (item) =>
        item.id === id,
    );

  if (
    !request ||
    !canViewRequest(
      user,
      request,
    )
  ) {
    return undefined;
  }

  return request;
}

/**
 * Menyimpan request baru sebagai Draf.
 */
export function saveDraftRequest(
  user: User,
  input: CreateRequestInput,
): FinanceRequest {
  return createRequest(
    user,
    input,
    "DRAFT",
  );
}

/**
 * Membuat request baru dan langsung mengirimkannya ke Finance.
 */
export function createAndSubmitRequest(
  user: User,
  input: CreateRequestInput,
): FinanceRequest {
  return createRequest(
    user,
    input,
    "SUBMITTED",
  );
}

function createRequest(
  user: User,
  input: CreateRequestInput,
  initialStatus:
    | "DRAFT"
    | "SUBMITTED",
): FinanceRequest {
  assertUnitUser(user);

  const requests =
    getMockRequestSnapshot();

  const createdAt =
    nowIso();

  const request: FinanceRequest =
    {
      id:
        createId("req"),

      requestNumber:
        getNextRequestNumber(
          requests,
        ),

      title:
        input.title.trim(),

      description:
        input.description.trim(),

      category:
        input.category,

      amount:
        input.amount,

      status:
        initialStatus,

      businessUnitId:
        user.businessUnitId,

      requesterId:
        user.id,

      beneficiaryName:
        input.beneficiaryName.trim(),

      beneficiaryBank:
        input.beneficiaryBank.trim(),

      beneficiaryAccount:
        input.beneficiaryAccount.trim(),

      neededAt:
        normalizeNeededAt(
          input.neededAt,
        ),

      createdAt,

      updatedAt:
        createdAt,

      paidAt: null,

      documents:
        createAttachmentDocuments(
          input.attachments ??
            [],
          user,
        ),

      activities: [
        {
          id:
            createId(
              "act",
            ),

          action:
            "CREATED",

          actorName:
            user.name,

          actorRole:
            user.role,

          createdAt,
        },
      ],
    };

  if (
    initialStatus ===
    "SUBMITTED"
  ) {
    validateSubmittableRequest(
      request,
    );

    request.activities.push(
      {
        id:
          createId(
            "act",
          ),

        action:
          "SUBMITTED",

        actorName:
          user.name,

        actorRole:
          user.role,

        createdAt,
      },
    );
  }

  return insertMockRequest(
    request,
  );
}

/**
 * Memperbarui request Draf atau Perlu Revisi.
 */
export function updateRequest(
  user: User,
  requestId: string,
  input: UpdateRequestInput,
): FinanceRequest {
  const existing =
    getRequest(
      user,
      requestId,
    );

  if (!existing) {
    throw new Error(
      "Pengajuan tidak ditemukan.",
    );
  }

  if (
    !canPerform(
      user,
      existing,
      "EDIT",
    )
  ) {
    throw new Error(
      "Pengajuan ini tidak dapat diubah.",
    );
  }

  const updated =
    updateMockRequest(
      requestId,
      (request) => {
        const officialDocuments =
          request.documents.filter(
            (document) =>
              document.type !==
              "LAMPIRAN",
          );

        const supportingDocuments =
          input.attachments !==
          undefined
            ? createAttachmentDocuments(
                input.attachments,
                user,
              )
            : request.documents.filter(
                (document) =>
                  document.type ===
                  "LAMPIRAN",
              );

        return {
          ...request,

          title:
            input.title !==
            undefined
              ? input.title.trim()
              : request.title,

          description:
            input.description !==
            undefined
              ? input.description.trim()
              : request.description,

          category:
            input.category ??
            request.category,

          amount:
            input.amount ??
            request.amount,

          beneficiaryName:
            input.beneficiaryName !==
            undefined
              ? input.beneficiaryName.trim()
              : request.beneficiaryName,

          beneficiaryBank:
            input.beneficiaryBank !==
            undefined
              ? input.beneficiaryBank.trim()
              : request.beneficiaryBank,

          beneficiaryAccount:
            input.beneficiaryAccount !==
            undefined
              ? input.beneficiaryAccount.trim()
              : request.beneficiaryAccount,

          neededAt:
            input.neededAt !==
            undefined
              ? normalizeNeededAt(
                  input.neededAt,
                )
              : request.neededAt,

          documents: [
            ...supportingDocuments,
            ...officialDocuments,
          ],

          updatedAt:
            nowIso(),
        };
      },
    );

  if (!updated) {
    throw new Error(
      "Gagal memperbarui pengajuan.",
    );
  }

  return updated;
}

/**
 * Mengirim Draf atau mengajukan ulang request yang memerlukan revisi.
 */
export function submitRequest(
  user: User,
  requestId: string,
): FinanceRequest {
  const existing =
    getRequest(
      user,
      requestId,
    );

  if (!existing) {
    throw new Error(
      "Pengajuan tidak ditemukan.",
    );
  }

  if (
    !canPerform(
      user,
      existing,
      "SUBMIT",
    )
  ) {
    throw new Error(
      "Pengajuan ini tidak dapat diajukan.",
    );
  }

  validateSubmittableRequest(
    existing,
  );

  assertStatusTransition(
    existing.status,
    "SUBMITTED",
  );

  const activityAction:
    ActivityAction =
    existing.status ===
    "REVISION_REQUIRED"
      ? "RESUBMITTED"
      : "SUBMITTED";

  const updated =
    updateMockRequest(
      requestId,
      (request) => {
        const timestamp =
          nowIso();

        return {
          ...request,

          status:
            "SUBMITTED",

          updatedAt:
            timestamp,

          activities: [
            ...request.activities,
            {
              id:
                createId(
                  "act",
                ),

              action:
                activityAction,

              actorName:
                user.name,

              actorRole:
                user.role,

              createdAt:
                timestamp,
            },
          ],
        };
      },
    );

  if (!updated) {
    throw new Error(
      "Gagal mengajukan pengajuan.",
    );
  }

  return updated;
}

export function getBusinessUnitName(
  businessUnitId: string,
): string {
  return (
    MOCK_BUSINESS_UNITS.find(
      (unit) =>
        unit.id ===
        businessUnitId,
    )?.name ?? "-"
  );
}

export function getUserName(
  userId: string,
): string {
  return (
    MOCK_USERS.find(
      (user) =>
        user.id ===
        userId,
    )?.name ?? "-"
  );
}

export function getLatestSubmittedAt(
  request: FinanceRequest,
): string | null {
  const activity =
    [...request.activities]
      .reverse()
      .find(
        (item) =>
          item.action ===
            "SUBMITTED" ||
          item.action ===
            "RESUBMITTED",
      );

  return (
    activity?.createdAt ??
    null
  );
}

export function getLatestActivityNote(
  request: FinanceRequest,
  action: ActivityAction,
): string | null {
  const activity =
    [...request.activities]
      .reverse()
      .find(
        (item) =>
          item.action ===
          action,
      );

  return (
    activity?.note ??
    null
  );
}

export function countByStatus(
  requests: FinanceRequest[],
): Record<
  RequestStatus,
  number
> {
  const base: Record<
    RequestStatus,
    number
  > = {
    DRAFT: 0,
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    REVISION_REQUIRED: 0,
    REJECTED: 0,
    APPROVED: 0,
    PAID: 0,
  };

  requests.forEach(
    (request) => {
      base[
        request.status
      ] += 1;
    },
  );

  return base;
}

function sumAmount(
  requests: FinanceRequest[],
): number {
  return requests.reduce(
    (
      total,
      request,
    ) =>
      total +
      request.amount,
    0,
  );
}

export function getDashboardStats(
  user: User,
  source:
    FinanceRequest[] =
    getMockRequestSnapshot(),
): DashboardStat[] {
  const requests =
    listRequests(
      user,
      source,
    );

  const counts =
    countByStatus(
      requests,
    );

  if (
    user.role ===
    "FINANCE_REVIEWER"
  ) {
    return [
      {
        key: "menunggu",
        label:
          "Menunggu Review",
        value: String(
          counts.SUBMITTED,
        ),
        helper:
          "Pengajuan baru belum ditinjau",
        tone: "primary",
      },
      {
        key: "review",
        label:
          "Sedang Direview",
        value: String(
          counts.UNDER_REVIEW,
        ),
        helper:
          "Sedang dalam proses peninjauan",
        tone: "neutral",
      },
      {
        key: "revisi",
        label:
          "Perlu Revisi",
        value: String(
          counts.REVISION_REQUIRED,
        ),
        helper:
          "Menunggu perbaikan dari unit",
        tone: "warning",
      },
      {
        key: "nilai",
        label:
          "Nilai Menunggu Keputusan",
        value:
          formatRupiahCompact(
            sumAmount(
              requests.filter(
                (request) =>
                  request.status ===
                    "SUBMITTED" ||
                  request.status ===
                    "UNDER_REVIEW",
              ),
            ),
          ),
        helper:
          "Total nominal dalam antrean review",
        tone:
          "neutral",
      },
    ];
  }

  if (
    user.role ===
    "FINANCE_PAYMENT"
  ) {
    return [
      {
        key: "siap",
        label:
          "Siap Dibayar",
        value: String(
          counts.APPROVED,
        ),
        helper:
          "Sudah disetujui reviewer",
        tone:
          "primary",
      },
      {
        key:
          "nilai-siap",
        label:
          "Nilai Siap Dibayar",
        value:
          formatRupiahCompact(
            sumAmount(
              requests.filter(
                (request) =>
                  request.status ===
                  "APPROVED",
              ),
            ),
          ),
        helper:
          "Total kebutuhan kas",
        tone:
          "warning",
      },
      {
        key:
          "dibayar",
        label:
          "Sudah Dibayar",
        value: String(
          counts.PAID,
        ),
        helper:
          "Pembayaran selesai",
        tone:
          "success",
      },
      {
        key:
          "nilai-dibayar",
        label:
          "Nilai Sudah Dibayar",
        value:
          formatRupiahCompact(
            sumAmount(
              requests.filter(
                (request) =>
                  request.status ===
                  "PAID",
              ),
            ),
          ),
        helper:
          "Realisasi pembayaran",
        tone:
          "success",
      },
    ];
  }

  if (
    user.role ===
    "ADMIN"
  ) {
    return [
      {
        key:
          "total",
        label:
          "Total Pengajuan",
        value: String(
          requests.length,
        ),
        helper:
          "Seluruh unit bisnis",
        tone:
          "primary",
      },
      {
        key:
          "aktif",
        label:
          "Sedang Berjalan",
        value: String(
          counts.SUBMITTED +
            counts.UNDER_REVIEW +
            counts.APPROVED,
        ),
        helper:
          "Belum selesai diproses",
        tone:
          "neutral",
      },
      {
        key:
          "pengguna",
        label:
          "Pengguna Aktif",
        value: String(
          MOCK_USERS.filter(
            (user) =>
              user.active,
          ).length,
        ),
        helper: `${MOCK_BUSINESS_UNITS.length} unit bisnis terdaftar`,
        tone:
          "neutral",
      },
      {
        key:
          "nilai",
        label:
          "Nilai Seluruh Pengajuan",
        value:
          formatRupiahCompact(
            sumAmount(
              requests,
            ),
          ),
        helper:
          "Akumulasi pengajuan",
        tone:
          "success",
      },
    ];
  }

  return [
    {
      key: "total",
      label:
        "Total Pengajuan Saya",
      value: String(
        requests.length,
      ),
      helper:
        "Termasuk draf",
      tone:
        "primary",
    },
    {
      key:
        "proses",
      label:
        "Dalam Proses",
      value: String(
        counts.SUBMITTED +
          counts.UNDER_REVIEW,
      ),
      helper:
        "Menunggu keputusan Finance",
      tone:
        "neutral",
    },
    {
      key:
        "revisi",
      label:
        "Perlu Revisi",
      value: String(
        counts.REVISION_REQUIRED,
      ),
      helper:
        "Perlu tindakan Anda",
      tone:
        "warning",
    },
    {
      key:
        "dibayar",
      label:
        "Sudah Dibayar",
      value:
        formatRupiahCompact(
          sumAmount(
            requests.filter(
              (request) =>
                request.status ===
                "PAID",
            ),
          ),
        ),
      helper:
        "Realisasi pencairan",
      tone:
        "success",
    },
  ];
}