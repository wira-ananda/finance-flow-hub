const APP_CONFIG = Object.freeze({
  appName: "Finance Request API",
  version: "1.0.0",

  sheets: Object.freeze({
    users: "users",
    businessUnits: "business_units",
    financialRequests: "financial_requests",
    requestAttachments: "request_attachments",
    requestReviews: "request_reviews",
    requestDocuments: "request_documents",
    requestPayments: "request_payments",
    requestHistories: "request_histories",
  }),
});

const DATABASE_SCHEMA = Object.freeze({
  users: [
    "id",
    "name",
    "email",
    "business_unit_id",
    "role",
    "job_title",
    "is_active",
    "created_at",
    "updated_at",
  ],

  business_units: [
    "id",
    "code",
    "name",
    "cost_center",
    "manager_name",
    "is_active",
    "created_at",
    "updated_at",
  ],

  financial_requests: [
    "id",
    "request_number",
    "business_unit_id",
    "requested_by",
    "title",
    "description",
    "category",
    "amount",
    "status",
    "beneficiary_name",
    "beneficiary_bank",
    "beneficiary_account",
    "needed_at",
    "submitted_at",
    "approved_at",
    "approved_by",
    "paid_at",
    "created_at",
    "updated_at",
  ],

  request_attachments: [
    "id",
    "request_id",
    "file_name",
    "file_id",
    "file_url",
    "mime_type",
    "size_kb",
    "uploaded_by",
    "created_at",
  ],

  request_reviews: [
    "id",
    "request_id",
    "reviewer_id",
    "action",
    "notes",
    "created_at",
  ],

  request_documents: [
    "id",
    "request_id",
    "document_type",
    "document_number",
    "file_name",
    "file_id",
    "file_url",
    "size_kb",
    "generated_at",
    "generated_by",
  ],

  request_payments: [
    "id",
    "request_id",
    "amount",
    "payment_date",
    "reference_number",
    "proof_file_name",
    "proof_file_id",
    "proof_file_url",
    "proof_mime_type",
    "proof_size_kb",
    "processed_by",
    "processed_at",
  ],

  request_histories: [
    "id",
    "request_id",
    "actor_id",
    "action",
    "previous_status",
    "new_status",
    "notes",
    "created_at",
  ],
});
const FILE_UPLOAD_CONFIG = Object.freeze({
  maxBytes: 10 * 1024 * 1024,

  allowedMimeTypes: ["application/pdf", "image/jpeg"],
});
