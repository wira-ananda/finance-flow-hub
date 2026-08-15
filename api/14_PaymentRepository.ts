function insertPaymentRecord(
  payment: RequestPaymentRecord,
): RequestPaymentRecord {
  appendRecord(
    APP_CONFIG.sheets.requestPayments,
    payment as unknown as SheetRecord,
  );

  return payment;
}

function findPaymentByRequestId(
  requestId: string,
): RequestPaymentRecord | null {
  const record = getRowsByField(
    APP_CONFIG.sheets.requestPayments,
    "request_id",
    requestId,
  )[0];

  if (!record) {
    return null;
  }

  return {
    id: String(record.id ?? ""),

    request_id: String(record.request_id ?? ""),

    amount: Number(record.amount ?? 0),

    payment_date: String(record.payment_date ?? ""),

    reference_number: String(record.reference_number ?? ""),

    proof_file_name: String(record.proof_file_name ?? ""),

    proof_file_id: String(record.proof_file_id ?? ""),

    proof_file_url: String(record.proof_file_url ?? ""),

    proof_mime_type: String(record.proof_mime_type ?? ""),

    proof_size_kb: Number(record.proof_size_kb ?? 0),

    processed_by: String(record.processed_by ?? ""),

    processed_at: String(record.processed_at ?? ""),
  };
}

function deletePaymentRecord(paymentId: string): boolean {
  return deleteRecordById(APP_CONFIG.sheets.requestPayments, paymentId);
}
