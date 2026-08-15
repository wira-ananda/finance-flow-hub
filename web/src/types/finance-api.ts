import type { RequestCategory, RequestStatus, UserRole } from "@/types";

export interface ApiUserRecord {
  id: string;
  name: string;
  email: string;
  business_unit_id: string;
  role: UserRole;
  job_title: string;

  is_active: boolean | string | number;

  created_at: string;
  updated_at: string;
}

export interface ApiBusinessUnitRecord {
  id: string;
  code: string;
  name: string;

  cost_center: string;
  manager_name: string;

  is_active: boolean | string | number;

  created_at: string;
  updated_at: string;
}

export interface ApiFinancialRequestRecord {
  id: string;

  request_number: string;

  business_unit_id: string;

  requested_by: string;

  title: string;
  description: string;

  category: RequestCategory;

  amount: number | string;

  status: RequestStatus;

  beneficiary_name: string;

  beneficiary_bank: string;

  beneficiary_account: string;

  needed_at: string;

  submitted_at: string;

  approved_at: string;

  approved_by: string;

  paid_at: string;

  created_at: string;

  updated_at: string;
}

export interface ApiRequestAttachmentRecord {
  id: string;
  request_id: string;

  file_name: string;
  file_id: string;
  file_url: string;

  mime_type: string;

  size_kb: number | string;

  uploaded_by: string;

  created_at: string;
}

export interface ApiRequestReviewRecord {
  id: string;
  request_id: string;
  reviewer_id: string;
  action: string;
  notes: string;
  created_at: string;
}

export interface ApiRequestPaymentRecord {
  id: string;
  request_id: string;

  amount: number | string;

  payment_date: string;

  reference_number: string;

  proof_file_name: string;

  proof_file_id: string;

  proof_file_url: string;

  proof_mime_type: string;

  proof_size_kb: number | string;

  processed_by: string;

  processed_at: string;
}

export interface ApiRequestHistoryRecord {
  id: string;
  request_id: string;
  actor_id: string;
  action: string;

  previous_status: string;

  new_status: string;

  notes: string;
  created_at: string;
}

export type ApiRequestDocumentType = "SURAT_PERSETUJUAN";

export interface ApiRequestDocumentRecord {
  id: string;
  request_id: string;

  document_type: ApiRequestDocumentType;

  document_number: string;

  file_name: string;

  file_id: string;

  file_url: string;

  size_kb: number | string;

  generated_at: string;

  generated_by: string;
}

export interface ApiRequestDetail {
  request: ApiFinancialRequestRecord;

  attachments?: ApiRequestAttachmentRecord[];

  reviews?: ApiRequestReviewRecord[];

  payments?: ApiRequestPaymentRecord[];

  payment?: ApiRequestPaymentRecord | null;

  histories?: ApiRequestHistoryRecord[];

  history?: ApiRequestHistoryRecord[];

  documents?: ApiRequestDocumentRecord[];
}

export interface ApiRequestInput {
  title: string;
  description: string;

  category: RequestCategory;

  amount: number;

  beneficiaryName: string;

  beneficiaryBank: string;

  beneficiaryAccount: string;

  neededAt: string;
}

export interface ApiCreateRequestPayload extends ApiRequestInput {
  submitNow: boolean;
}
