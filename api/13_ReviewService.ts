function startReviewService(
  actorId: string,
  requestId: string,
): FinancialRequestRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    assertActorRole(actor, "FINANCE_REVIEWER");

    const request = findRequestRecordById(requestId);

    if (!request) {
      throw createDomainError(
        "Pengajuan tidak ditemukan.",
        "REQUEST_NOT_FOUND",
      );
    }

    assertCanViewRequest(actor, request);

    assertStatusTransition(request.status, "UNDER_REVIEW");

    const previousStatus = request.status;

    const timestamp = nowIso();

    const updated = updateRequestRecord(request.id, {
      status: "UNDER_REVIEW",

      updated_at: timestamp,
    });

    recordReviewAction(request.id, actor.id, "START_REVIEW");

    recordRequestHistory(
      request.id,
      actor.id,
      "REVIEW_STARTED",
      previousStatus,
      "UNDER_REVIEW",
    );

    return updated;
  });
}

function requestRevisionService(
  actorId: string,
  requestId: string,
  notes: string,
): FinancialRequestRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    assertActorRole(actor, "FINANCE_REVIEWER");

    const cleanNotes = String(notes ?? "").trim();

    if (!cleanNotes) {
      throw createDomainError(
        "Catatan revisi wajib diisi.",
        "VALIDATION_ERROR",
      );
    }

    const request = findRequestRecordById(requestId);

    if (!request) {
      throw createDomainError(
        "Pengajuan tidak ditemukan.",
        "REQUEST_NOT_FOUND",
      );
    }

    assertStatusTransition(request.status, "REVISION_REQUIRED");

    const previousStatus = request.status;

    const timestamp = nowIso();

    const updated = updateRequestRecord(request.id, {
      status: "REVISION_REQUIRED",

      updated_at: timestamp,
    });

    recordReviewAction(request.id, actor.id, "REQUEST_REVISION", cleanNotes);

    recordRequestHistory(
      request.id,
      actor.id,
      "REVISION_REQUESTED",
      previousStatus,
      "REVISION_REQUIRED",
      cleanNotes,
    );

    return updated;
  });
}

function rejectRequestService(
  actorId: string,
  requestId: string,
  reason: string,
): FinancialRequestRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    assertActorRole(actor, "FINANCE_REVIEWER");

    const cleanReason = String(reason ?? "").trim();

    if (!cleanReason) {
      throw createDomainError(
        "Alasan penolakan wajib diisi.",
        "VALIDATION_ERROR",
      );
    }

    const request = findRequestRecordById(requestId);

    if (!request) {
      throw createDomainError(
        "Pengajuan tidak ditemukan.",
        "REQUEST_NOT_FOUND",
      );
    }

    assertStatusTransition(request.status, "REJECTED");

    const previousStatus = request.status;

    const timestamp = nowIso();

    const updated = updateRequestRecord(request.id, {
      status: "REJECTED",

      updated_at: timestamp,
    });

    recordReviewAction(request.id, actor.id, "REJECT", cleanReason);

    recordRequestHistory(
      request.id,
      actor.id,
      "REJECTED",
      previousStatus,
      "REJECTED",
      cleanReason,
    );

    return updated;
  });
}

function approveRequestService(
  actorId: string,
  requestId: string,
): FinancialRequestRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    assertActorRole(actor, "FINANCE_REVIEWER");

    const request = findRequestRecordById(requestId);

    if (!request) {
      throw createDomainError(
        "Pengajuan tidak ditemukan.",
        "REQUEST_NOT_FOUND",
      );
    }

    assertStatusTransition(request.status, "APPROVED");

    const previousStatus = request.status;

    const timestamp = nowIso();

    /*
     * Dokumen dibuat sebelum status final diubah.
     * Kalau generate PDF gagal, request tetap UNDER_REVIEW.
     */
    const approvalDocument = generateApprovalDocumentService(
      request,
      actor,
      timestamp,
    );

    let requestUpdated = false;

    let reviewRecord: RequestReviewRecord | null = null;

    let historyRecord: RequestHistoryRecord | null = null;

    try {
      const updated = updateRequestRecord(request.id, {
        status: "APPROVED",

        approved_at: timestamp,

        approved_by: actor.id,

        updated_at: timestamp,
      });

      requestUpdated = true;

      reviewRecord = recordReviewAction(request.id, actor.id, "APPROVE");

      historyRecord = recordRequestHistory(
        request.id,
        actor.id,
        "APPROVED",
        previousStatus,
        "APPROVED",
      );

      return updated;
    } catch (error) {
      if (historyRecord) {
        try {
          deleteHistoryRecord(historyRecord.id);
        } catch (rollbackError) {
          console.error("Rollback history gagal.", rollbackError);
        }
      }

      if (reviewRecord) {
        try {
          deleteReviewRecord(reviewRecord.id);
        } catch (rollbackError) {
          console.error("Rollback review gagal.", rollbackError);
        }
      }

      if (requestUpdated) {
        try {
          updateRequestRecord(request.id, {
            status: request.status,

            approved_at: request.approved_at,

            approved_by: request.approved_by,

            updated_at: request.updated_at,
          });
        } catch (rollbackError) {
          console.error("Rollback request gagal.", rollbackError);
        }
      }

      rollbackApprovalDocument(approvalDocument);

      throw error;
    }
  });
}
