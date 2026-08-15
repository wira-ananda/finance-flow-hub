interface ProcessPaymentPayload {
  amount: number;
  paymentDate: string;
  referenceNumber: string;
  proofFile: UploadFileInput;
}

function processPaymentService(
  actorId: string,
  requestId: string,
  payload: ProcessPaymentPayload,
): FinancialRequestRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    assertActorRole(actor, "FINANCE_PAYMENT");

    const request = findRequestRecordById(requestId);

    if (!request) {
      throw createDomainError(
        "Pengajuan tidak ditemukan.",
        "REQUEST_NOT_FOUND",
      );
    }

    assertCanViewRequest(actor, request);

    assertStatusTransition(request.status, "PAID");

    if (findPaymentByRequestId(request.id)) {
      throw createDomainError(
        "Pengajuan ini sudah memiliki data pembayaran.",
        "PAYMENT_ALREADY_EXISTS",
      );
    }

    const amount = Number(payload.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw createDomainError(
        "Nominal pembayaran harus lebih besar dari Rp0.",
        "VALIDATION_ERROR",
      );
    }

    const paymentDate = String(payload.paymentDate ?? "").trim();

    if (!paymentDate) {
      throw createDomainError(
        "Tanggal pembayaran wajib diisi.",
        "VALIDATION_ERROR",
      );
    }

    const referenceNumber = String(payload.referenceNumber ?? "").trim();

    if (!referenceNumber) {
      throw createDomainError(
        "Nomor referensi pembayaran wajib diisi.",
        "VALIDATION_ERROR",
      );
    }

    if (!payload.proofFile) {
      throw createDomainError(
        "Bukti pembayaran wajib diupload.",
        "PAYMENT_PROOF_REQUIRED",
      );
    }

    const storedProof = storeUploadFile(
      getPaymentProofsRootFolder(),
      request.request_number,
      "PAYMENT_PROOF",
      payload.proofFile,
    );

    const timestamp = nowIso();

    const payment: RequestPaymentRecord = {
      id: createEntityId("payment"),

      request_id: request.id,

      amount,

      payment_date: paymentDate,

      reference_number: referenceNumber,

      proof_file_name: storedProof.fileName,

      proof_file_id: storedProof.fileId,

      proof_file_url: storedProof.fileUrl,

      proof_mime_type: storedProof.mimeType,

      proof_size_kb: storedProof.sizeKb,

      processed_by: actor.id,

      processed_at: timestamp,
    };

    let paymentInserted = false;

    let requestUpdated = false;

    try {
      insertPaymentRecord(payment);

      paymentInserted = true;

      const updated = updateRequestRecord(request.id, {
        status: "PAID",

        paid_at: timestamp,

        updated_at: timestamp,
      });

      requestUpdated = true;

      recordRequestHistory(
        request.id,
        actor.id,
        "PAID",
        "APPROVED",
        "PAID",
        `Pembayaran ${referenceNumber}`,
      );

      return updated;
    } catch (error) {
      /*
       * Google Sheets dan Drive bukan satu transaction.
       * Kalau salah satu write gagal, kita lakukan kompensasi
       * agar state sebisa mungkin kembali seperti sebelumnya.
       */

      if (requestUpdated) {
        try {
          updateRequestRecord(request.id, {
            status: request.status,

            paid_at: request.paid_at,

            updated_at: request.updated_at,
          });
        } catch (rollbackError) {
          console.error("Rollback request gagal.", rollbackError);
        }
      }

      if (paymentInserted) {
        try {
          deletePaymentRecord(payment.id);
        } catch (rollbackError) {
          console.error("Rollback payment gagal.", rollbackError);
        }
      }

      safeTrashDriveFile(storedProof.fileId);

      throw error;
    }
  });
}
