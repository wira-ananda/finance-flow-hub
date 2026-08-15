function mapAttachmentRecord(record: SheetRecord): RequestAttachmentRecord {
  return {
    id: String(record.id ?? ""),

    request_id: String(record.request_id ?? ""),

    file_name: String(record.file_name ?? ""),

    file_id: String(record.file_id ?? ""),

    file_url: String(record.file_url ?? ""),

    mime_type: String(record.mime_type ?? ""),

    size_kb: Number(record.size_kb ?? 0),

    uploaded_by: String(record.uploaded_by ?? ""),

    created_at: String(record.created_at ?? ""),
  };
}

function listAttachmentRecords(requestId: string): RequestAttachmentRecord[] {
  return getRowsByField(
    APP_CONFIG.sheets.requestAttachments,
    "request_id",
    requestId,
  ).map(mapAttachmentRecord);
}

function findAttachmentRecordById(
  attachmentId: string,
): RequestAttachmentRecord | null {
  const record = findRowById(
    APP_CONFIG.sheets.requestAttachments,
    attachmentId,
  );

  return record ? mapAttachmentRecord(record) : null;
}

function insertAttachmentRecord(
  attachment: RequestAttachmentRecord,
): RequestAttachmentRecord {
  appendRecord(
    APP_CONFIG.sheets.requestAttachments,
    attachment as unknown as SheetRecord,
  );

  return attachment;
}

function deleteAttachmentRecord(attachmentId: string): boolean {
  return deleteRecordById(APP_CONFIG.sheets.requestAttachments, attachmentId);
}
