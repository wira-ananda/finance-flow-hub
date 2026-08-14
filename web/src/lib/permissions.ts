import type { FinanceRequest, NavItem, User, UserRole } from "@/types";

export type RequestAction =
  | "VIEW"
  | "EDIT"
  | "SUBMIT"
  | "START_REVIEW"
  | "REQUEST_REVISION"
  | "REJECT"
  | "APPROVE"
  | "PROCESS_PAYMENT";

export const ACTION_LABELS: Record<RequestAction, string> = {
  VIEW: "Lihat Detail",
  EDIT: "Ubah Pengajuan",
  SUBMIT: "Ajukan",
  START_REVIEW: "Mulai Review",
  REQUEST_REVISION: "Minta Revisi",
  REJECT: "Tolak",
  APPROVE: "Setujui",
  PROCESS_PAYMENT: "Proses Pembayaran",
};

/**
 * Memeriksa apakah user dapat melihat sebuah pengajuan.
 */
export function canViewRequest(user: User, request: FinanceRequest): boolean {
  if (!user.active) {
    return false;
  }

  switch (user.role) {
    case "UNIT_USER":
      return request.businessUnitId === user.businessUnitId;

    case "FINANCE_REVIEWER":
      return request.status !== "DRAFT";

    case "FINANCE_PAYMENT":
      return ["APPROVED", "PAID"].includes(request.status);

    case "ADMIN":
      return true;
  }
}

/**
 * Memeriksa apakah user dapat menjalankan action pada pengajuan.
 */
export function canPerform(user: User, request: FinanceRequest, action: RequestAction): boolean {
  if (!canViewRequest(user, request)) {
    return false;
  }

  switch (action) {
    case "VIEW":
      return true;

    case "EDIT":
    case "SUBMIT":
      return (
        user.role === "UNIT_USER" &&
        request.requesterId === user.id &&
        ["DRAFT", "REVISION_REQUIRED"].includes(request.status)
      );

    case "START_REVIEW":
      return user.role === "FINANCE_REVIEWER" && request.status === "SUBMITTED";

    case "REQUEST_REVISION":
    case "REJECT":
    case "APPROVE":
      return user.role === "FINANCE_REVIEWER" && request.status === "UNDER_REVIEW";

    case "PROCESS_PAYMENT":
      return user.role === "FINANCE_PAYMENT" && request.status === "APPROVED";
  }
}

/**
 * Mengambil action utama yang tersedia pada detail pengajuan.
 */
export function availableActions(user: User, request: FinanceRequest): RequestAction[] {
  const actions: RequestAction[] = [
    "EDIT",
    "SUBMIT",
    "START_REVIEW",
    "REQUEST_REVISION",
    "REJECT",
    "APPROVE",
    "PROCESS_PAYMENT",
  ];

  return actions.filter((action) => canPerform(user, request, action));
}

/**
 * Memfilter navigasi berdasarkan role aktif.
 */
export function navItemsForRole(role: UserRole, items: NavItem[]): NavItem[] {
  return items.filter((item) => item.roles.includes(role));
}
