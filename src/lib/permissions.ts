import type {
  FinanceRequest,
  NavItem,
  User,
  UserRole,
} from "@/types";

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

export const ACTION_LABELS: Record<
  RequestAction,
  string
> = {
  VIEW: "Lihat Detail",
  EDIT: "Ubah Pengajuan",
  SUBMIT: "Ajukan",
  START_REVIEW: "Mulai Review",
  REQUEST_REVISION:
    "Minta Revisi",
  REJECT: "Tolak",
  APPROVE: "Setujui",
  PROCESS_PAYMENT:
    "Proses Pembayaran",
  UPLOAD_APPROVAL_LETTER:
    "Unggah Surat Persetujuan",
  UPLOAD_TRANSFER_PROOF:
    "Unggah Bukti Transfer",
};

/**
 * Memeriksa apakah user boleh melihat sebuah pengajuan.
 */
export function canViewRequest(
  user: User,
  request: FinanceRequest,
): boolean {
  switch (user.role) {
    case "UNIT_USER":
      return (
        request.businessUnitId ===
        user.businessUnitId
      );

    case "FINANCE_REVIEWER":
      return request.status !==
        "DRAFT";

    case "FINANCE_PAYMENT":
      return [
        "APPROVED",
        "PAID",
      ].includes(
        request.status,
      );

    case "ADMIN":
      return true;
  }
}

/**
 * Memeriksa permission action berdasarkan role dan status.
 */
export function canPerform(
  user: User,
  request: FinanceRequest,
  action: RequestAction,
): boolean {
  if (
    !canViewRequest(
      user,
      request,
    )
  ) {
    return false;
  }

  switch (action) {
    case "VIEW":
      return true;

    case "EDIT":
      return (
        user.role ===
          "UNIT_USER" &&
        request.requesterId ===
          user.id &&
        [
          "DRAFT",
          "REVISION_REQUIRED",
        ].includes(
          request.status,
        )
      );

    case "SUBMIT":
      return (
        user.role ===
          "UNIT_USER" &&
        request.requesterId ===
          user.id &&
        [
          "DRAFT",
          "REVISION_REQUIRED",
        ].includes(
          request.status,
        )
      );

    case "START_REVIEW":
      return (
        user.role ===
          "FINANCE_REVIEWER" &&
        request.status ===
          "SUBMITTED"
      );

    case "REQUEST_REVISION":
    case "REJECT":
    case "APPROVE":
      return (
        user.role ===
          "FINANCE_REVIEWER" &&
        request.status ===
          "UNDER_REVIEW"
      );

    case "UPLOAD_APPROVAL_LETTER":
      return (
        user.role ===
          "FINANCE_REVIEWER" &&
        request.status ===
          "APPROVED"
      );

    case "PROCESS_PAYMENT":
      return (
        user.role ===
          "FINANCE_PAYMENT" &&
        request.status ===
          "APPROVED"
      );

    case "UPLOAD_TRANSFER_PROOF":
      return (
        user.role ===
          "FINANCE_PAYMENT" &&
        [
          "APPROVED",
          "PAID",
        ].includes(
          request.status,
        )
      );
  }
}

/**
 * Mengambil action yang tersedia untuk sebuah pengajuan.
 */
export function availableActions(
  user: User,
  request: FinanceRequest,
): RequestAction[] {
  const actions: RequestAction[] = [
    "EDIT",
    "SUBMIT",
    "START_REVIEW",
    "REQUEST_REVISION",
    "REJECT",
    "APPROVE",
    "UPLOAD_APPROVAL_LETTER",
    "PROCESS_PAYMENT",
    "UPLOAD_TRANSFER_PROOF",
  ];

  return actions.filter(
    (action) =>
      canPerform(
        user,
        request,
        action,
      ),
  );
}

/**
 * Memfilter menu navigasi berdasarkan role.
 */
export function navItemsForRole(
  role: UserRole,
  items: NavItem[],
): NavItem[] {
  return items.filter(
    (item) =>
      item.roles.includes(role),
  );
}