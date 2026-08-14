import { getMockRequestSnapshot } from "@/data/repositories/mock-request.repository";
import { formatRupiahCompact } from "@/lib/formatters";
import { canViewRequest } from "@/lib/permissions";
import { getBusinessUnit, listBusinessUnits } from "@/services/business-unit.service";
import { getUserById, listUsers } from "@/services/user.service";
import type { ActivityAction, DashboardStat, FinanceRequest, RequestStatus, User } from "@/types";

export interface DashboardStatsContext {
  activeUserCount?: number;
  businessUnitCount?: number;
}

/**
 * Mengambil seluruh pengajuan yang dapat diakses user.
 */
export function listRequests(
  user: User,
  source: FinanceRequest[] = getMockRequestSnapshot(),
): FinanceRequest[] {
  return source
    .filter((request) => canViewRequest(user, request))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Mengambil pengajuan berdasarkan beberapa status.
 */
export function listRequestsByStatus(
  user: User,
  statuses: RequestStatus[],
  source: FinanceRequest[] = getMockRequestSnapshot(),
): FinanceRequest[] {
  return listRequests(user, source).filter((request) => statuses.includes(request.status));
}

/**
 * Mengambil satu pengajuan sesuai permission user.
 */
export function getRequest(
  user: User,
  id: string,
  source: FinanceRequest[] = getMockRequestSnapshot(),
): FinanceRequest | undefined {
  const request = source.find((item) => item.id === id);

  if (!request || !canViewRequest(user, request)) {
    return undefined;
  }

  return request;
}

/**
 * Mengambil nama Unit Bisnis untuk kebutuhan UI.
 */
export function getBusinessUnitName(businessUnitId: string): string {
  return getBusinessUnit(businessUnitId)?.name ?? "-";
}

/**
 * Mengambil nama user untuk kebutuhan UI.
 */
export function getUserName(userId: string): string {
  return getUserById(userId)?.name ?? "-";
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
  source: FinanceRequest[] = getMockRequestSnapshot(),
  context: DashboardStatsContext = {},
): DashboardStat[] {
  const requests = listRequests(user, source);
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
    const activeUserCount =
      context.activeUserCount ?? listUsers().filter((item) => item.active).length;

    const businessUnitCount = context.businessUnitCount ?? listBusinessUnits().length;

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
        value: String(activeUserCount),
        helper: `${businessUnitCount} unit bisnis terdaftar`,
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
