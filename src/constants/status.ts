import type { RequestCategory, RequestStatus, UserRole, ActivityAction } from "@/types";

export const STATUS_LABELS: Record<RequestStatus, string> = {
  DRAFT: "Draf",
  SUBMITTED: "Diajukan",
  UNDER_REVIEW: "Sedang Direview",
  REVISION_REQUIRED: "Perlu Revisi",
  REJECTED: "Ditolak",
  APPROVED: "Disetujui",
  PAID: "Sudah Dibayar",
};

export const STATUS_ORDER: RequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUIRED",
  "REJECTED",
  "APPROVED",
  "PAID",
];

/** Maps each status to its semantic token class set (works in both themes). */
export const STATUS_TOKEN: Record<RequestStatus, string> = {
  DRAFT: "status-draft",
  SUBMITTED: "status-submitted",
  UNDER_REVIEW: "status-review",
  REVISION_REQUIRED: "status-revision",
  REJECTED: "status-rejected",
  APPROVED: "status-approved",
  PAID: "status-paid",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  UNIT_USER: "Unit Bisnis",
  FINANCE_REVIEWER: "Finance Reviewer",
  FINANCE_PAYMENT: "Finance Payment",
  ADMIN: "Administrator",
};

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  OPERASIONAL: "Operasional",
  PENGADAAN: "Pengadaan",
  PERJALANAN_DINAS: "Perjalanan Dinas",
  REIMBURSEMENT: "Reimbursement",
  PEMASARAN: "Pemasaran",
};

export const DOCUMENT_TYPE_LABELS: Record<RequestDocumentType, string> = {
  LAMPIRAN: "Dokumen Pendukung",
  SURAT_PERSETUJUAN: "Surat Persetujuan",
  BUKTI_TRANSFER: "Bukti Transfer",
};

export type RequestDocumentType = "LAMPIRAN" | "SURAT_PERSETUJUAN" | "BUKTI_TRANSFER";

export const ACTIVITY_LABELS: Record<ActivityAction, string> = {
  CREATED: "Pengajuan dibuat",
  SUBMITTED: "Pengajuan diajukan",
  REVIEW_STARTED: "Review dimulai",
  REVISION_REQUESTED: "Revisi diminta",
  REJECTED: "Pengajuan ditolak",
  APPROVED: "Pengajuan disetujui",
  PAID: "Pembayaran diproses",
  COMMENT: "Catatan ditambahkan",
};

export const APP_NAME = "Finance Request";
export const APP_NAME_FULL = "Finance Request Management System";
