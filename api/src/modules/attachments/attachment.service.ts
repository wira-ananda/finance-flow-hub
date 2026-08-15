function uploadRequestAttachmentService(
  actorId: string,
  requestId: string,
  fileInput: UploadFileInput,
): RequestAttachmentRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    const request = findRequestRecordById(requestId);

    if (!request) {
      throw createDomainError(
        "Pengajuan tidak ditemukan.",
        "REQUEST_NOT_FOUND",
      );
    }

    assertEditableRequest(actor, request);

    const storedFile = storeUploadFile(
      getAttachmentsRootFolder(),
      request.request_number,
      "ATTACHMENT",
      fileInput,
    );

    const attachment: RequestAttachmentRecord = {
      id: createEntityId("att"),

      request_id: request.id,

      file_name: storedFile.fileName,

      file_id: storedFile.fileId,

      file_url: storedFile.fileUrl,

      mime_type: storedFile.mimeType,

      size_kb: storedFile.sizeKb,

      uploaded_by: actor.id,

      created_at: nowIso(),
    };

    try {
      insertAttachmentRecord(attachment);
    } catch (error) {
      safeTrashDriveFile(storedFile.fileId);

      throw error;
    }

    recordRequestHistory(
      request.id,
      actor.id,
      "ATTACHMENT_UPLOADED",
      request.status,
      request.status,
      attachment.file_name,
    );

    return attachment;
  });
}

function deleteRequestAttachmentService(
  actorId: string,
  attachmentId: string,
): void {
  withDatabaseLock(() => {
    const actor = getActorById(actorId);

    const attachment = findAttachmentRecordById(attachmentId);

    if (!attachment) {
      throw createDomainError(
        "Attachment tidak ditemukan.",
        "ATTACHMENT_NOT_FOUND",
      );
    }

    const request = findRequestRecordById(attachment.request_id);

    if (!request) {
      throw createDomainError(
        "Pengajuan tidak ditemukan.",
        "REQUEST_NOT_FOUND",
      );
    }

    assertEditableRequest(actor, request);

    let driveFile: GoogleAppsScript.Drive.File | null = null;

    try {
      driveFile = DriveApp.getFileById(attachment.file_id);

      driveFile.setTrashed(true);
    } catch (error) {
      console.error(
        "File Drive tidak ditemukan atau gagal dipindahkan ke trash.",
        error,
      );
    }

    try {
      const deleted = deleteAttachmentRecord(attachment.id);

      if (!deleted) {
        throw createDomainError(
          "Record attachment gagal dihapus.",
          "ATTACHMENT_DELETE_FAILED",
        );
      }
    } catch (error) {
      if (driveFile) {
        try {
          driveFile.setTrashed(false);
        } catch {
          // Tidak ada tindakan tambahan.
        }
      }

      throw error;
    }

    recordRequestHistory(
      request.id,
      actor.id,
      "ATTACHMENT_DELETED",
      request.status,
      request.status,
      attachment.file_name,
    );
  });
}
