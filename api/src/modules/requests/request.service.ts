interface RequestInput {
  title?: string;
  description?: string;
  category?: RequestCategory;
  amount?: number;
  beneficiaryName?: string;
  beneficiaryBank?: string;
  beneficiaryAccount?: string;
  neededAt?: string;
}

interface CreateRequestPayload extends RequestInput {
  submitNow?: boolean;
}

function getActorById(actorId: string): UserRecord {
  const actorRecord = findUserRecordById(actorId);

  if (!actorRecord) {
    throw createDomainError("Pengguna tidak ditemukan.", "USER_NOT_FOUND");
  }

  const actor: UserRecord = {
    id: String(actorRecord.id ?? ""),

    name: String(actorRecord.name ?? ""),

    email: String(actorRecord.email ?? ""),

    business_unit_id: String(actorRecord.business_unit_id ?? ""),

    role: String(actorRecord.role ?? "") as UserRole,

    job_title: String(actorRecord.job_title ?? ""),

    is_active: normalizeBoolean(actorRecord.is_active),

    created_at: String(actorRecord.created_at ?? ""),

    updated_at: String(actorRecord.updated_at ?? ""),
  };

  assertActiveActor(actor);

  return actor;
}

function listRequestsForActor(actorId: string): FinancialRequestRecord[] {
  const actor = getActorById(actorId);

  return listRequestRecords()
    .filter((request) => canActorViewRequest(actor, request))
    .sort(
      (first, second) =>
        new Date(second.updated_at).getTime() -
        new Date(first.updated_at).getTime(),
    );
}

function getRequestForActor(
  actorId: string,
  requestId: string,
): FinancialRequestRecord {
  const actor = getActorById(actorId);

  const request = findRequestRecordById(requestId);

  if (!request) {
    throw createDomainError("Pengajuan tidak ditemukan.", "REQUEST_NOT_FOUND");
  }

  assertCanViewRequest(actor, request);

  return request;
}

function getRequestDetailForActor(
  actorId: string,
  requestId: string,
): SheetRecord {
  const request = getRequestForActor(actorId, requestId);

  return {
    request,

    attachments: getRowsByField(
      APP_CONFIG.sheets.requestAttachments,
      "request_id",
      requestId,
    ),

    reviews: getRowsByField(
      APP_CONFIG.sheets.requestReviews,
      "request_id",
      requestId,
    ),

    documents: getRowsByField(
      APP_CONFIG.sheets.requestDocuments,
      "request_id",
      requestId,
    ),

    payment:
      getRowsByField(
        APP_CONFIG.sheets.requestPayments,
        "request_id",
        requestId,
      )[0] ?? null,

    histories: listRequestHistoryRecords(requestId),
  };
}

function createRequestService(
  actorId: string,
  payload: CreateRequestPayload,
): FinancialRequestRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    assertActorRole(actor, "UNIT_USER");

    if (!actor.business_unit_id) {
      throw createDomainError(
        "User tidak memiliki Unit Bisnis.",
        "BUSINESS_UNIT_REQUIRED",
      );
    }

    const timestamp = nowIso();

    const request: FinancialRequestRecord = {
      id: createEntityId("req"),

      request_number: getNextRequestNumber(),

      business_unit_id: actor.business_unit_id,

      requested_by: actor.id,

      title: String(payload.title ?? "").trim(),

      description: String(payload.description ?? "").trim(),

      category: String(payload.category ?? "OPERASIONAL") as RequestCategory,

      amount: Number(payload.amount ?? 0),

      status: "DRAFT",

      beneficiary_name: String(payload.beneficiaryName ?? "").trim(),

      beneficiary_bank: String(payload.beneficiaryBank ?? "").trim(),

      beneficiary_account: String(payload.beneficiaryAccount ?? "").trim(),

      needed_at: String(payload.neededAt ?? ""),

      submitted_at: "",

      approved_at: "",

      approved_by: "",

      paid_at: "",

      created_at: timestamp,

      updated_at: timestamp,
    };

    insertRequestRecord(request);

    recordRequestHistory(request.id, actor.id, "CREATED", "", "DRAFT");

    if (payload.submitNow) {
      assertSubmittableRequest(request);

      const submittedAt = nowIso();

      const submitted = updateRequestRecord(request.id, {
        status: "SUBMITTED",

        submitted_at: submittedAt,

        updated_at: submittedAt,
      });

      recordRequestHistory(
        request.id,
        actor.id,
        "SUBMITTED",
        "DRAFT",
        "SUBMITTED",
      );

      return submitted;
    }
    return request;
  });
}

function updateRequestService(
  actorId: string,
  requestId: string,
  payload: RequestInput,
): FinancialRequestRecord {
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

    const updated = updateRequestRecord(request.id, {
      title:
        payload.title !== undefined
          ? String(payload.title).trim()
          : request.title,

      description:
        payload.description !== undefined
          ? String(payload.description).trim()
          : request.description,

      category: payload.category ?? request.category,

      amount:
        payload.amount !== undefined ? Number(payload.amount) : request.amount,

      beneficiary_name:
        payload.beneficiaryName !== undefined
          ? String(payload.beneficiaryName).trim()
          : request.beneficiary_name,

      beneficiary_bank:
        payload.beneficiaryBank !== undefined
          ? String(payload.beneficiaryBank).trim()
          : request.beneficiary_bank,

      beneficiary_account:
        payload.beneficiaryAccount !== undefined
          ? String(payload.beneficiaryAccount).trim()
          : request.beneficiary_account,

      needed_at:
        payload.neededAt !== undefined
          ? String(payload.neededAt)
          : request.needed_at,

      updated_at: nowIso(),
    });

    recordRequestHistory(
      request.id,
      actor.id,
      "UPDATED",
      request.status,
      request.status,
    );

    return updated;
  });
}

function submitRequestService(
  actorId: string,
  requestId: string,
): FinancialRequestRecord {
  const execute = () => {
    const actor = getActorById(actorId);

    const request = findRequestRecordById(requestId);

    if (!request) {
      throw createDomainError(
        "Pengajuan tidak ditemukan.",
        "REQUEST_NOT_FOUND",
      );
    }

    assertEditableRequest(actor, request);

    assertSubmittableRequest(request);

    assertStatusTransition(request.status, "SUBMITTED");

    const previousStatus = request.status;

    const action =
      previousStatus === "REVISION_REQUIRED" ? "RESUBMITTED" : "SUBMITTED";

    const timestamp = nowIso();

    const updated = updateRequestRecord(request.id, {
      status: "SUBMITTED",

      submitted_at: timestamp,

      updated_at: timestamp,
    });

    recordRequestHistory(
      request.id,
      actor.id,
      action,
      previousStatus,
      "SUBMITTED",
    );

    return updated;
  };

  /*
   * createRequestService sudah berada di dalam lock
   * ketika submitNow = true.
   */
  return LockService.getScriptLock().hasLock()
    ? execute()
    : withDatabaseLock(execute);
}
