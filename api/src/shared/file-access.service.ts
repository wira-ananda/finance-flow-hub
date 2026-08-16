interface RequestFilePayload {
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeKb: number;
  base64: string;
}

const SECURE_FILE_PROXY_MAX_BYTES = 3 * 1024 * 1024;

function findRequestFileMetadata(
  requestId: string,
  fileId: string,
): {
  fileName: string;
  mimeType: string;
} | null {
  const attachment = listAttachmentRecords(requestId).find(
    (record) => record.file_id === fileId,
  );

  if (attachment) {
    return {
      fileName: attachment.file_name,
      mimeType: attachment.mime_type,
    };
  }

  const document = listRequestDocumentRecords(requestId).find(
    (record) => record.file_id === fileId,
  );

  if (document) {
    return {
      fileName: document.file_name,
      mimeType: "application/pdf",
    };
  }

  const payment = findPaymentByRequestId(requestId);

  if (payment?.proof_file_id === fileId) {
    return {
      fileName: payment.proof_file_name,
      mimeType: payment.proof_mime_type,
    };
  }

  return null;
}

/**
 * Mengambil file request setelah memastikan actor memang dapat melihat request
 * dan file tersebut benar-benar tercatat sebagai file milik request.
 */
function getRequestFileService(
  actorId: string,
  requestId: string,
  fileId: string,
): RequestFilePayload {
  const actor = getActorById(actorId);
  const request = findRequestRecordById(requestId);

  if (!request) {
    throw createDomainError("Pengajuan tidak ditemukan.", "REQUEST_NOT_FOUND");
  }

  assertCanViewRequest(actor, request);

  const metadata = findRequestFileMetadata(request.id, fileId);

  if (!metadata) {
    throw createDomainError(
      "File tidak ditemukan pada pengajuan ini.",
      "REQUEST_FILE_NOT_FOUND",
    );
  }

  let file: GoogleAppsScript.Drive.File;

  try {
    file = DriveApp.getFileById(fileId);
  } catch {
    throw createDomainError(
      "File Google Drive tidak ditemukan.",
      "DRIVE_FILE_NOT_FOUND",
    );
  }

  if (file.isTrashed()) {
    throw createDomainError(
      "File sudah tidak tersedia.",
      "DRIVE_FILE_NOT_FOUND",
    );
  }

  const sizeBytes = file.getSize();

  if (sizeBytes > SECURE_FILE_PROXY_MAX_BYTES) {
    throw createDomainError(
      "File terlalu besar untuk dibuka melalui aplikasi web.",
      "FILE_PROXY_SIZE_EXCEEDED",
    );
  }

  const blob = file.getBlob();

  return {
    fileId,
    fileName: metadata.fileName || file.getName(),
    mimeType:
      metadata.mimeType || blob.getContentType() || "application/octet-stream",
    sizeKb: Math.ceil(sizeBytes / 1024),
    base64: Utilities.base64Encode(blob.getBytes()),
  };
}
