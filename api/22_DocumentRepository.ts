function mapRequestDocumentRecord(record: SheetRecord): RequestDocumentRecord {
  return {
    id: String(record.id ?? ""),

    request_id: String(record.request_id ?? ""),

    document_type: String(record.document_type ?? "") as RequestDocumentType,

    document_number: String(record.document_number ?? ""),

    file_name: String(record.file_name ?? ""),

    file_id: String(record.file_id ?? ""),

    file_url: String(record.file_url ?? ""),

    size_kb: Number(record.size_kb ?? 0),

    generated_at: String(record.generated_at ?? ""),

    generated_by: String(record.generated_by ?? ""),
  };
}

function listRequestDocumentRecords(
  requestId: string,
): RequestDocumentRecord[] {
  return getRowsByField(
    APP_CONFIG.sheets.requestDocuments,
    "request_id",
    requestId,
  ).map(mapRequestDocumentRecord);
}

function findApprovalDocumentByRequestId(
  requestId: string,
): RequestDocumentRecord | null {
  return (
    listRequestDocumentRecords(requestId).find(
      (document) => document.document_type === "SURAT_PERSETUJUAN",
    ) ?? null
  );
}

function insertRequestDocumentRecord(
  document: RequestDocumentRecord,
): RequestDocumentRecord {
  appendRecord(
    APP_CONFIG.sheets.requestDocuments,
    document as unknown as SheetRecord,
  );

  return document;
}

function deleteRequestDocumentRecord(documentId: string): boolean {
  return deleteRecordById(APP_CONFIG.sheets.requestDocuments, documentId);
}

function getNextApprovalDocumentNumber(): string {
  const year = new Date().getFullYear();

  const highestSequence = getAllRows(APP_CONFIG.sheets.requestDocuments).reduce(
    (highest: number, record: SheetRecord) => {
      if (String(record.document_type ?? "") !== "SURAT_PERSETUJUAN") {
        return highest;
      }

      const documentNumber = String(record.document_number ?? "");

      const match = documentNumber.match(/^APP-(\d{4})-(\d+)$/);

      if (!match || Number(match[1]) !== year) {
        return highest;
      }

      return Math.max(highest, Number(match[2]));
    },
    0,
  );

  return `APP-${year}-${String(highestSequence + 1).padStart(4, "0")}`;
}
