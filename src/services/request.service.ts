import { MOCK_REQUESTS } from "@/data/mock/requests";
import { MOCK_BUSINESS_UNITS } from "@/data/mock/business-units";
import { MOCK_USERS } from "@/data/mock/users";
import { canViewRequest } from "@/lib/permissions";
import type { DashboardStat, FinanceRequest, RequestStatus, User } from "@/types";
import { formatRupiahCompact } from "@/lib/formatters";

/**
 * Mock data access layer. Semua pembacaan data pengajuan melewati service ini
 * sehingga penggantian ke backend nyata di tahap berikutnya hanya menyentuh file ini.
 */

export function listRequests(user: User): FinanceRequest[] {
  return MOCK_REQUESTS.filter((request) => canViewRequest(user, request)).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function listRequestsByStatus(user: User, statuses: RequestStatus[]): FinanceRequest[] {
  return listRequests(user).filter((request) => statuses.includes(request.status));
}

export function getRequest(user: User, id: string): FinanceRequest | undefined {
  const request = MOCK_REQUESTS.find((item) => item.id === id);
  if (!request || !canViewRequest(user, request)) return undefined;
  return request;
}

export function getBusinessUnitName(businessUnitId: string): string {
  return MOCK_BUSINESS_UNITS.find((unit) => unit.id === businessUnitId)?.name ?? "-";
}

export function getUserName(userId: string): string {
  return MOCK_USERS.find((item) => item.id === userId)?.name ?? "-";
}

export function countByStatus(requests: FinanceRequest[]): Record<RequestStatus, number> {
  const base: Record<RequestStatus, number> = {
    DRAFT: 0,
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    REVISION_REQUIRED: 0,
    REJECTED: 0,
    APPROVED: 0,
    PAID: 0,
  };
  for (const request of requests) base[request.status] += 1;
  return base;
}

function sumAmount(requests: FinanceRequest[]): number {
  return requests.reduce((total, request) => total + request.amount, 0);
}

export function getDashboardStats(user: User): DashboardStat[] {
  const requests = listRequests(user);
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
          sumAmount(requests.filter((r) => ["SUBMITTED", "UNDER_REVIEW"].includes(r.status))),
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
        value: formatRupiahCompact(sumAmount(requests.filter((r) => r.status === "APPROVED"))),
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
        value: formatRupiahCompact(sumAmount(requests.filter((r) => r.status === "PAID"))),
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
        value: String(counts.SUBMITTED + counts.UNDER_REVIEW + counts.APPROVED),
        helper: "Belum selesai diproses",
        tone: "neutral",
      },
      {
        key: "pengguna",
        label: "Pengguna Aktif",
        value: String(MOCK_USERS.filter((item) => item.active).length),
        helper: `${MOCK_BUSINESS_UNITS.length} unit bisnis terdaftar`,
        tone: "neutral",
      },
      {
        key: "nilai",
        label: "Nilai Seluruh Pengajuan",
        value: formatRupiahCompact(sumAmount(requests)),
        helper: "Akumulasi tahun 2026",
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
      value: formatRupiahCompact(sumAmount(requests.filter((r) => r.status === "PAID"))),
      helper: "Realisasi pencairan",
      tone: "success",
    },
  ];
}
