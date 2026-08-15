interface PreparedUploadFile {
  bytes: number[];
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

function storeUploadFile(
  parentFolder: GoogleAppsScript.Drive.Folder,
  requestNumber: string,
  fileKind: string,
  input: UploadFileInput,
): StoredDriveFile {
  const prepared = prepareUploadFile(input);

  const requestFolder = getOrCreateRequestDriveFolder(
    parentFolder,
    requestNumber,
  );

  const storedFileName = buildStoredFileName(
    requestNumber,
    fileKind,
    prepared.originalName,
  );

  const blob = Utilities.newBlob(
    prepared.bytes,
    prepared.mimeType,
    storedFileName,
  );

  const file = requestFolder.createFile(blob);

  return {
    fileId: file.getId(),
    fileUrl: file.getUrl(),
    fileName: file.getName(),
    mimeType: prepared.mimeType,
    sizeKb: Math.ceil(file.getSize() / 1024),
  };
}

function prepareUploadFile(input: UploadFileInput): PreparedUploadFile {
  if (!input) {
    throw createDomainError("File wajib diisi.", "FILE_REQUIRED");
  }

  const originalName = sanitizeOriginalFileName(String(input.name ?? ""));

  if (!originalName) {
    throw createDomainError("Nama file tidak valid.", "INVALID_FILE_NAME");
  }

  const mimeType = normalizeUploadMimeType(String(input.mimeType ?? ""));

  assertAllowedMimeType(mimeType);

  assertFileExtension(originalName, mimeType);

  const base64 = normalizeBase64Payload(String(input.base64 ?? ""));

  if (!base64) {
    throw createDomainError(
      "Isi file tidak ditemukan.",
      "FILE_CONTENT_REQUIRED",
    );
  }

  let bytes: number[];

  try {
    bytes = Utilities.base64Decode(base64);
  } catch {
    throw createDomainError("File Base64 tidak valid.", "INVALID_BASE64");
  }

  if (bytes.length === 0) {
    throw createDomainError("File kosong tidak dapat diupload.", "EMPTY_FILE");
  }

  if (bytes.length > FILE_UPLOAD_CONFIG.maxBytes) {
    throw createDomainError("Ukuran file maksimal 10 MB.", "FILE_TOO_LARGE");
  }

  assertFileSignature(bytes, mimeType);

  return {
    bytes,
    originalName,
    mimeType,
    sizeBytes: bytes.length,
  };
}

function normalizeUploadMimeType(mimeType: string): string {
  const normalized = mimeType.trim().toLowerCase();

  if (normalized === "image/jpg") {
    return "image/jpeg";
  }

  return normalized;
}

function assertAllowedMimeType(mimeType: string): void {
  if (!FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(mimeType)) {
    throw createDomainError(
      "Format file harus PDF, JPG, atau JPEG.",
      "UNSUPPORTED_FILE_TYPE",
    );
  }
}

function assertFileExtension(fileName: string, mimeType: string): void {
  const extension = getFileExtension(fileName);

  if (mimeType === "application/pdf" && extension !== "pdf") {
    throw createDomainError(
      "Extension file tidak sesuai dengan MIME type PDF.",
      "FILE_EXTENSION_MISMATCH",
    );
  }

  if (mimeType === "image/jpeg" && !["jpg", "jpeg"].includes(extension)) {
    throw createDomainError(
      "Extension file tidak sesuai dengan MIME type JPEG.",
      "FILE_EXTENSION_MISMATCH",
    );
  }
}

function assertFileSignature(bytes: number[], mimeType: string): void {
  if (mimeType === "application/pdf") {
    const isPdf =
      normalizeByte(bytes[0]) === 0x25 &&
      normalizeByte(bytes[1]) === 0x50 &&
      normalizeByte(bytes[2]) === 0x44 &&
      normalizeByte(bytes[3]) === 0x46;

    if (!isPdf) {
      throw createDomainError(
        "Isi file tidak sesuai dengan format PDF.",
        "FILE_CONTENT_MISMATCH",
      );
    }

    return;
  }

  if (mimeType === "image/jpeg") {
    const isJpeg =
      normalizeByte(bytes[0]) === 0xff &&
      normalizeByte(bytes[1]) === 0xd8 &&
      normalizeByte(bytes[2]) === 0xff;

    if (!isJpeg) {
      throw createDomainError(
        "Isi file tidak sesuai dengan format JPEG.",
        "FILE_CONTENT_MISMATCH",
      );
    }
  }
}

function normalizeByte(value: number | undefined): number {
  return Number(value ?? 0) & 0xff;
}

function normalizeBase64Payload(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith("data:")) {
    const commaIndex = trimmed.indexOf(",");

    if (commaIndex === -1) {
      throw createDomainError("Data URL file tidak valid.", "INVALID_BASE64");
    }

    return trimmed.slice(commaIndex + 1).replace(/\s/g, "");
  }

  return trimmed.replace(/\s/g, "");
}

function sanitizeOriginalFileName(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).pop()?.trim() ?? "";

  return baseName
    .replace(/[^a-zA-Z0-9._() -]/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.pop() ?? "";
}

function buildStoredFileName(
  requestNumber: string,
  fileKind: string,
  originalName: string,
): string {
  const timestamp = Date.now();

  return [
    sanitizeDriveSegment(requestNumber),
    sanitizeDriveSegment(fileKind),
    String(timestamp),
    originalName,
  ].join("_");
}

function getOrCreateRequestDriveFolder(
  parentFolder: GoogleAppsScript.Drive.Folder,
  requestNumber: string,
): GoogleAppsScript.Drive.Folder {
  const folderName = sanitizeDriveSegment(requestNumber);

  const folders = parentFolder.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return parentFolder.createFolder(folderName);
}

function sanitizeDriveSegment(value: string): string {
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

function safeTrashDriveFile(fileId: string): void {
  if (!fileId) {
    return;
  }

  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (error) {
    console.error(`Gagal memindahkan file ${fileId} ke trash.`, error);
  }
}
