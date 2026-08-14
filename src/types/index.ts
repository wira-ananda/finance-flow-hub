export type UserRole =
  | "UNIT_USER"
  | "FINANCE_REVIEWER"
  | "FINANCE_PAYMENT"
  | "ADMIN";

export type RequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "REVISION_REQUIRED"
  | "REJECTED"
  | "APPROVED"
  | "PAID";

export type RequestCategory =
  | "OPERASIONAL"
  | "PENGADAAN"
  | "PERJALANAN_DINAS"
  | "REIMBURSEMENT"
  | "PEMASARAN";

export type RequestDocumentType =
  | "LAMPIRAN"
  | "SURAT_PERSETUJUAN"
  | "BUKTI_TRANSFER";

export interface BusinessUnit {
  id: string;
  code: string;
  name: string;
  costCenter: string;
  managerName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jobTitle: string;
  businessUnitId: string | null;
  initials: string;
  active: boolean;
}

export interface RequestDocument {
  id: string;
  name: string;
  type: RequestDocumentType;
  sizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
}

export type ActivityAction =
  | "CREATED"
  | "SUBMITTED"
  | "REVIEW_STARTED"
  | "REVISION_REQUESTED"
  | "RESUBMITTED"
  | "REJECTED"
  | "APPROVED"
  | "APPROVAL_LETTER_GENERATED"
  | "PAID"
  | "COMMENT";

export interface ActivityEntry {
  id: string;
  action: ActivityAction;
  actorName: string;
  actorRole: UserRole;
  note?: string;
  createdAt: string;
}

export interface FinanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  category: RequestCategory;
  amount: number;
  status: RequestStatus;
  businessUnitId: string;
  requesterId: string;
  beneficiaryName: string;
  beneficiaryBank: string;
  beneficiaryAccount: string;
  neededAt: string;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  documents: RequestDocument[];
  activities: ActivityEntry[];
}

export interface DashboardStat {
  key: string;
  label: string;
  value: string;
  helper: string;
  tone:
    | "neutral"
    | "primary"
    | "warning"
    | "success"
    | "danger";
}

export interface NavItem {
  label: string;
  to: string;
  icon: string;
  roles: UserRole[];
  group:
    | "Utama"
    | "Finance"
    | "Administrasi";
}