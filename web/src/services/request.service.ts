import { apiGet } from "@/lib/api/client";

import { canViewRequest } from "@/lib/permissions";

import { mapApiFinancialRequest, mapApiRequestDetail } from "@/lib/api/mappers";

import { formatRupiahCompact } from "@/lib/formatters";

import type { ApiFinancialRequestRecord, ApiRequestDetail } from "@/types/finance-api";

import type {
  ActivityAction,
  BusinessUnit,
  DashboardStat,
  FinanceRequest,
  RequestStatus,
  User,
} from "@/types";

export interface DashboardStatsContext {
  activeUserCount?: number;

  businessUnitCount?: number;
}

/**
 * Mengambil seluruh pengajuan yang dapat diakses actor dari Finance API.
 */
export async function fetchRequests(
  actorId: string,
  users: User[],
  signal?: AbortSignal,
): Promise<FinanceRequest[]> {
  const records = await apiGet<ApiFinancialRequestRecord[]>(
    "requests.list",
    {
      actorId,
    },
    signal,
  );

  return records
    .map((record) => mapApiFinancialRequest(record, users))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Mengambil detail pengajuan sesuai permission actor dari Finance API.
 */
export async function fetchRequestDetail(
  actorId: string,
  requestId: string,
  users: User[],
  signal?: AbortSignal,
): Promise<FinanceRequest> {
  const detail = await apiGet<ApiRequestDetail>(
    "requests.get",
    {
      actorId,
      id: requestId,
    },
    signal,
  );

  return mapApiRequestDetail(detail, users);
}

/**
 * Compatibility sementara untuk signature service lama sampai Step 7E/7G.
 * Tidak membaca mock repository; tanpa source explicit helper ini akan mengembalikan undefined.
 */
export function getRequest(
  user: User,
  id: string,
  source: FinanceRequest[] = [],
): FinanceRequest | undefined {
  const request = source.find((item) => item.id === id);

  if (!request || !canViewRequest(user, request)) {
    return undefined;
  }

  return request;
}

/**
 * Mengambil nama Unit Bisnis dari master data yang sudah tersedia.
 */
export function getBusinessUnitName(businessUnitId: string, units: BusinessUnit[]): string {
  return units.find((unit) => unit.id === businessUnitId)?.name ?? "-";
}

/**
 * Mengambil nama user dari master data yang sudah tersedia.
 */
export function getUserName(userId: string, users: User[]): string {
  return users.find((user) => user.id === userId)?.name ?? "-";
}

/**
 * Mengambil waktu submit atau resubmit terakhir.
 */
export function getLatestSubmittedAt(request: FinanceRequest): string | null {
  const activity = [...request.activities]
    .reverse()
    .find((item) => item.action === "SUBMITTED" || item.action === "RESUBMITTED");

  return activity?.createdAt ?? null;
}

/**
 * Mengambil catatan terakhir untuk jenis aktivitas tertentu.
 */
export function getLatestActivityNote(
  request: FinanceRequest,
  action: ActivityAction,
): string | null {
  const activity = [...request.activities].reverse().find((item) => item.action === action);

  return activity?.note ?? null;
}

/**
 * Menghitung jumlah pengajuan per status.
 */
export function countByStatus(requests: FinanceRequest[]): Record<RequestStatus, number> {
  const counts: Record<RequestStatus, number> = {
    DRAFT: 0,
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    REVISION_REQUIRED: 0,
    REJECTED: 0,
    APPROVED: 0,
    PAID: 0,
  };

  requests.forEach((request) => {
    counts[request.status] += 1;
  });

  return counts;
}

function sumAmount(requests: FinanceRequest[]): number {
  return requests.reduce((total, request) => total + request.amount, 0);
}

export function getDashboardStats(
  user: User,
  requests: FinanceRequest[],
  context: DashboardStatsContext = {},
): DashboardStat[] {
  const counts = countByStatus(requests);

  if (user.role === "FINANCE_REVIEWER") {
    return [
      {
        key: "menunggu",
        label: "Menunggu Review",
        value: String(counts.SUBMITTED),
        helper: "Pengajuan baru belum ditinjau",
        tone: "primary",
      },

      {
        key: "review",
        label: "Sedang Direview",
        value: String(counts.UNDER_REVIEW),
        helper: "Sedang dalam proses peninjauan",
        tone: "neutral",
      },

      {
        key: "revisi",
        label: "Perlu Revisi",
        value: String(counts.REVISION_REQUIRED),
        helper: "Menunggu perbaikan dari unit",
        tone: "warning",
      },

      {
        key: "nilai",
        label: "Nilai Menunggu Keputusan",
        value: formatRupiahCompact(
          sumAmount(
            requests.filter((request) => ["SUBMITTED", "UNDER_REVIEW"].includes(request.status)),
          ),
        ),
        helper: "Total nominal dalam antrean review",
        tone: "neutral",
      },
    ];
  }

  if (user.role === "FINANCE_PAYMENT") {
    return [
      {
        key: "siap",
        label: "Siap Dibayar",
        value: String(counts.APPROVED),
        helper: "Sudah disetujui reviewer",
        tone: "primary",
      },

      {
        key: "nilai-siap",
        label: "Nilai Siap Dibayar",
        value: formatRupiahCompact(
          sumAmount(requests.filter((request) => request.status === "APPROVED")),
        ),
        helper: "Total kebutuhan kas",
        tone: "warning",
      },

      {
        key: "dibayar",
        label: "Sudah Dibayar",
        value: String(counts.PAID),
        helper: "Pembayaran selesai",
        tone: "success",
      },

      {
        key: "nilai-dibayar",
        label: "Nilai Sudah Dibayar",
        value: formatRupiahCompact(
          sumAmount(requests.filter((request) => request.status === "PAID")),
        ),
        helper: "Realisasi pembayaran",
        tone: "success",
      },
    ];
  }

  if (user.role === "ADMIN") {
    return [
      {
        key: "total",
        label: "Total Pengajuan",
        value: String(requests.length),
        helper: "Seluruh unit bisnis",
        tone: "primary",
      },

      {
        key: "aktif",
        label: "Sedang Berjalan",
        value: String(
          counts.SUBMITTED + counts.UNDER_REVIEW + counts.REVISION_REQUIRED + counts.APPROVED,
        ),
        helper: "Belum selesai diproses",
        tone: "neutral",
      },

      {
        key: "pengguna",
        label: "Pengguna Aktif",
        value: String(context.activeUserCount ?? 0),
        helper: `${context.businessUnitCount ?? 0} unit bisnis terdaftar`,
        tone: "neutral",
      },

      {
        key: "nilai",
        label: "Nilai Seluruh Pengajuan",
        value: formatRupiahCompact(sumAmount(requests)),
        helper: "Akumulasi pengajuan",
        tone: "success",
      },
    ];
  }

  return [
    {
      key: "total",
      label: "Total Pengajuan Saya",
      value: String(requests.length),
      helper: "Termasuk draf",
      tone: "primary",
    },

    {
      key: "proses",
      label: "Dalam Proses",
      value: String(counts.SUBMITTED + counts.UNDER_REVIEW),
      helper: "Menunggu keputusan Finance",
      tone: "neutral",
    },

    {
      key: "revisi",
      label: "Perlu Revisi",
      value: String(counts.REVISION_REQUIRED),
      helper: "Perlu tindakan Anda",
      tone: "warning",
    },

    {
      key: "dibayar",
      label: "Sudah Dibayar",
      value: formatRupiahCompact(
        sumAmount(requests.filter((request) => request.status === "PAID")),
      ),
      helper: "Realisasi pencairan",
      tone: "success",
    },
  ];
}
