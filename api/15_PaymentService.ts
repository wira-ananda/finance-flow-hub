interface ProcessPaymentPayload {
  amount: number;
  paymentDate: string;
  referenceNumber: string;

  /**
   * Step 6B boleh diisi dummy untuk testing.
   * Step 6C nanti berasal dari Google Drive upload.
   */
  proofFileId: string;
  proofFileUrl: string;
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

    if (amount <= 0) {
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

    const timestamp = nowIso();

    insertPaymentRecord({
      id: createEntityId("payment"),

      request_id: request.id,

      amount,

      payment_date: paymentDate,

      reference_number: referenceNumber,

      proof_file_id: String(payload.proofFileId ?? ""),

      proof_file_url: String(payload.proofFileUrl ?? ""),

      processed_by: actor.id,

      processed_at: timestamp,
    });

    const updated = updateRequestRecord(request.id, {
      status: "PAID",

      paid_at: timestamp,

      updated_at: timestamp,
    });

    recordRequestHistory(
      request.id,
      actor.id,
      "PAID",
      "APPROVED",
      "PAID",
      `Pembayaran ${referenceNumber}`,
    );

    return updated;
  });
}
