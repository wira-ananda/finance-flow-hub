import { apiPost } from "@/lib/api/client";
import { fileToApiUploadInput } from "@/lib/file-upload";

import type { User } from "@/types";
import type { FileUploadItem } from "@/types/files";
import type { ApiRequestAttachmentRecord, ApiUploadFileInput } from "@/types/finance-api";

interface UploadAttachmentBody extends Record<string, unknown> {
  actorId: string;
  id: string;
  file: ApiUploadFileInput;
}

interface DeleteAttachmentBody extends Record<string, unknown> {
  actorId: string;
  attachmentId: string;
}

/**
 * Mengunggah satu dokumen pendukung ke Google Drive melalui Finance API.
 */
export async function uploadRequestAttachment(
  user: User,
  requestId: string,
  file: File,
): Promise<ApiRequestAttachmentRecord> {
  const uploadFile = await fileToApiUploadInput(file);

  return apiPost<ApiRequestAttachmentRecord, UploadAttachmentBody>("attachments.upload", {
    actorId: user.id,
    id: requestId,
    file: uploadFile,
  });
}

/**
 * Menghapus satu dokumen pendukung dari request yang masih editable.
 */
export async function deleteRequestAttachment(user: User, attachmentId: string): Promise<void> {
  await apiPost<null, DeleteAttachmentBody>("attachments.delete", {
    actorId: user.id,
    attachmentId,
  });
}

/**
 * Menyamakan attachment form dengan attachment yang sudah tersimpan di backend.
 * File baru diunggah lebih dulu agar kegagalan upload tidak menghapus file existing.
 */
export async function syncRequestAttachments(
  user: User,
  requestId: string,
  initialAttachmentIds: string[],
  files: FileUploadItem[],
): Promise<void> {
  const localFiles = files.filter((item) => item.file instanceof File);

  for (const item of localFiles) {
    await uploadRequestAttachment(user, requestId, item.file!);
  }

  const retainedRemoteIds = new Set(files.filter((item) => !item.file).map((item) => item.id));

  const deletedAttachmentIds = initialAttachmentIds.filter(
    (attachmentId) => !retainedRemoteIds.has(attachmentId),
  );

  for (const attachmentId of deletedAttachmentIds) {
    await deleteRequestAttachment(user, attachmentId);
  }
}
