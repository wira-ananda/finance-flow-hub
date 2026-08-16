import type { ApiUploadFileInput } from "@/types/finance-api";

export const MAX_WEB_UPLOAD_SIZE_MB = 3;
export const MAX_WEB_UPLOAD_SIZE_BYTES = MAX_WEB_UPLOAD_SIZE_MB * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = ["application/pdf", "image/jpeg"] as const;

/**
 * Menormalkan MIME type browser untuk format file yang diizinkan backend.
 */
export function normalizeUploadMimeType(file: File): string {
  const normalized = file.type.trim().toLowerCase();

  if (normalized === "image/jpg") {
    return "image/jpeg";
  }

  if (normalized) {
    return normalized;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (extension === "pdf") {
    return "application/pdf";
  }

  if (["jpg", "jpeg"].includes(extension)) {
    return "image/jpeg";
  }

  return "";
}

/**
 * Memvalidasi file sebelum dikonversi menjadi Base64 untuk Finance API.
 */
export function validateUploadFile(file: File): string {
  const mimeType = normalizeUploadMimeType(file);
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(mimeType as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number])) {
    throw new Error(`${file.name}: format harus PDF, JPG, atau JPEG.`);
  }

  if (mimeType === "application/pdf" && extension !== "pdf") {
    throw new Error(`${file.name}: extension file tidak sesuai dengan format PDF.`);
  }

  if (mimeType === "image/jpeg" && !["jpg", "jpeg"].includes(extension)) {
    throw new Error(`${file.name}: extension file tidak sesuai dengan format JPEG.`);
  }

  if (file.size <= 0) {
    throw new Error(`${file.name}: file kosong tidak dapat diunggah.`);
  }

  if (file.size > MAX_WEB_UPLOAD_SIZE_BYTES) {
    throw new Error(`${file.name}: ukuran maksimal ${MAX_WEB_UPLOAD_SIZE_MB} MB.`);
  }

  return mimeType;
}

/**
 * Mengubah File browser menjadi payload Base64 yang diterima Google Apps Script.
 */
export async function fileToApiUploadInput(file: File): Promise<ApiUploadFileInput> {
  const mimeType = validateUploadFile(file);

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error(`Gagal membaca file ${file.name}.`));
    };

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Gagal membaca file ${file.name}.`));

        return;
      }

      const commaIndex = reader.result.indexOf(",");

      if (commaIndex === -1) {
        reject(new Error(`Format file ${file.name} tidak valid.`));

        return;
      }

      resolve(reader.result.slice(commaIndex + 1));
    };

    reader.readAsDataURL(file);
  });

  return {
    name: file.name,
    mimeType,
    base64,
  };
}
