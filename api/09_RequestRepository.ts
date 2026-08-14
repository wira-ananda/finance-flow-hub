function mapFinancialRequestRecord(
  record: SheetRecord,
): FinancialRequestRecord {
  return {
    id: String(record.id ?? ""),

    request_number: String(record.request_number ?? ""),

    business_unit_id: String(record.business_unit_id ?? ""),

    requested_by: String(record.requested_by ?? ""),

    title: String(record.title ?? ""),

    description: String(record.description ?? ""),

    category: String(record.category ?? "") as RequestCategory,

    amount: Number(record.amount ?? 0),

    status: String(record.status ?? "DRAFT") as RequestStatus,

    beneficiary_name: String(record.beneficiary_name ?? ""),

    beneficiary_bank: String(record.beneficiary_bank ?? ""),

    beneficiary_account: String(record.beneficiary_account ?? ""),

    needed_at: String(record.needed_at ?? ""),

    submitted_at: String(record.submitted_at ?? ""),

    approved_at: String(record.approved_at ?? ""),

    approved_by: String(record.approved_by ?? ""),

    paid_at: String(record.paid_at ?? ""),

    created_at: String(record.created_at ?? ""),

    updated_at: String(record.updated_at ?? ""),
  };
}

function listRequestRecords(): FinancialRequestRecord[] {
  return getAllRows(APP_CONFIG.sheets.financialRequests).map(
    mapFinancialRequestRecord,
  );
}

function findRequestRecordById(
  requestId: string,
): FinancialRequestRecord | null {
  const record = findRowById(APP_CONFIG.sheets.financialRequests, requestId);

  return record ? mapFinancialRequestRecord(record) : null;
}

function insertRequestRecord(
  request: FinancialRequestRecord,
): FinancialRequestRecord {
  appendRecord(
    APP_CONFIG.sheets.financialRequests,
    request as unknown as SheetRecord,
  );

  return request;
}

function updateRequestRecord(
  requestId: string,
  changes: Partial<FinancialRequestRecord>,
): FinancialRequestRecord {
  const updated = updateRecordById(
    APP_CONFIG.sheets.financialRequests,
    requestId,
    changes as SheetRecord,
  );

  if (!updated) {
    throw createDomainError("Pengajuan tidak ditemukan.", "REQUEST_NOT_FOUND");
  }

  return mapFinancialRequestRecord(updated);
}

function getNextRequestNumber(): string {
  const year = new Date().getFullYear();

  const highestSequence = listRequestRecords().reduce((highest, request) => {
    const match = request.request_number.match(/^REQ-\d{4}-(\d+)$/);

    if (!match) {
      return highest;
    }

    return Math.max(highest, Number(match[1]));
  }, 0);

  return `REQ-${year}-${String(highestSequence + 1).padStart(4, "0")}`;
}
