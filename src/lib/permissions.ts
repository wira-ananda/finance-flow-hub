import type { FinanceRequest, NavItem, RequestStatus, User, UserRole } from "@/types";

export type RequestAction =
  | "VIEW"
  | "EDIT"
  | "SUBMIT"
  | "START_REVIEW"
  | "REQUEST_REVISION"
  | "REJECT"
  | "APPROVE"
  | "PROCESS_PAYMENT"
  | "UPLOAD_APPROVAL_LETTER"
  | "UPLOAD_TRANSFER_PROOF";

export const ACTION_LABELS: Record<RequestAction, string> = {
  VIEW: "Lihat Detail",
  EDIT: "Ubah Pengajuan",
  SUBMIT: "Ajukan",
  START_REVIEW: "Mulai Review",
  REQUEST_REVISION: "Minta Revisi",
  REJECT: "Tolak",
  APPROVE: "Setujui",
  PROCESS_PAYMENT: "Proses Pembayaran",
  UPLOAD_APPROVAL_LETTER: "Unggah Surat Persetujuan",
  UPLOAD_TRANSFER_PROOF: "Unggah Bukti Transfer",
};

const REVIEWER_STATUSES: RequestStatus[] = ["SUBMITTED", "UNDER_REVIEW"];

export function canViewRequest(user: User, request: FinanceRequest): boolean {
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

export function canPerform(
  user: User,
  request: FinanceRequest,
  action: RequestAction,
): boolean {
  if (!canViewRequest(user, request)) return false;

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
      return user.role === "FINANCE_REVIEWER" && REVIEWER_STATUSES.includes(request.status);
    case "UPLOAD_APPROVAL_LETTER":
      return user.role === "FINANCE_REVIEWER" && request.status === "APPROVED";
    case "PROCESS_PAYMENT":
      return user.role === "FINANCE_PAYMENT" && request.status === "APPROVED";
    case "UPLOAD_TRANSFER_PROOF":
      return user.role === "FINANCE_PAYMENT" && ["APPROVED", "PAID"].includes(request.status);
  }
}

export function availableActions(user: User, request: FinanceRequest): RequestAction[] {
  const all: RequestAction[] = [
    "EDIT",
    "SUBMIT",
    "START_REVIEW",
    "APPROVE",
    "REQUEST_REVISION",
    "REJECT",
    "UPLOAD_APPROVAL_LETTER",
    "PROCESS_PAYMENT",
    "UPLOAD_TRANSFER_PROOF",
  ];
  return all.filter((action) => canPerform(user, request, action));
}

export function navItemsForRole(role: UserRole, items: NavItem[]): NavItem[] {
  return items.filter((item) => item.roles.includes(role));
}
