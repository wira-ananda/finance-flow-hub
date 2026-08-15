interface ParsedApiRequest {
  method: "GET" | "POST";
  action: string;
  query: Record<string, string>;
  body: Record<string, unknown>;
}

function handleRequest(
  method: "GET" | "POST",
  event: GoogleAppsScript.Events.DoGet | GoogleAppsScript.Events.DoPost,
) {
  try {
    const request = parseRequest(method, event);

    return routeRequest(request);
  } catch (error) {
    console.error(
      error instanceof Error ? (error.stack ?? error.message) : error,
    );

    return errorResponse(
      error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
      getErrorCode(error),
    );
  }
}

function parseRequest(
  method: "GET" | "POST",
  event: GoogleAppsScript.Events.DoGet | GoogleAppsScript.Events.DoPost,
): ParsedApiRequest {
  const query = (
    event && "parameter" in event && event.parameter ? event.parameter : {}
  ) as Record<string, string>;

  const body = method === "POST" ? parseJsonBody(event) : {};

  const action = query.action ?? String(body.action ?? "health");

  return {
    method,
    action,
    query,
    body,
  };
}

function parseJsonBody(
  event: GoogleAppsScript.Events.DoGet | GoogleAppsScript.Events.DoPost,
): Record<string, unknown> {
  if (!("postData" in event) || !event.postData || !event.postData.contents) {
    return {};
  }

  try {
    return JSON.parse(event.postData.contents) as Record<string, unknown>;
  } catch {
    throw createDomainError(
      "Request body harus berupa JSON yang valid.",
      "INVALID_JSON",
    );
  }
}

function requireString(value: unknown, field: string): string {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw createDomainError(`${field} wajib diisi.`, "VALIDATION_ERROR");
  }

  return normalized;
}

function routeRequest(request: ParsedApiRequest) {
  switch (request.action) {
    // =========================
    // FOUNDATION
    // =========================

    case "health":
      return handleHealth();

    case "schema.validate":
      return handleSchemaValidation();

    case "users.list":
      return handleListUsers();

    case "business-units.list":
      return handleListBusinessUnits();

    // =========================
    // REQUESTS
    // =========================

    case "requests.list": {
      const actorId = requireString(request.query.actorId, "actorId");

      return successResponse(listRequestsForActor(actorId));
    }

    case "requests.get": {
      const actorId = requireString(request.query.actorId, "actorId");

      const requestId = requireString(request.query.id, "id");

      return successResponse(getRequestDetailForActor(actorId, requestId));
    }

    case "requests.create": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const payload = (request.body.request ?? {}) as CreateRequestPayload;

      return successResponse(
        createRequestService(actorId, payload),
        "Pengajuan berhasil dibuat.",
      );
    }

    case "requests.update": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const requestId = requireString(request.body.id, "id");

      const payload = (request.body.request ?? {}) as RequestInput;

      return successResponse(
        updateRequestService(actorId, requestId, payload),
        "Pengajuan berhasil diperbarui.",
      );
    }

    case "requests.submit": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const requestId = requireString(request.body.id, "id");

      return successResponse(
        submitRequestService(actorId, requestId),
        "Pengajuan berhasil diajukan.",
      );
    }

    // =========================
    // REVIEW
    // =========================

    case "reviews.start": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const requestId = requireString(request.body.id, "id");

      return successResponse(
        startReviewService(actorId, requestId),
        "Review dimulai.",
      );
    }

    case "reviews.revision": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const requestId = requireString(request.body.id, "id");

      const notes = requireString(request.body.notes, "notes");

      return successResponse(
        requestRevisionService(actorId, requestId, notes),
        "Revisi berhasil diminta.",
      );
    }

    case "reviews.reject": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const requestId = requireString(request.body.id, "id");

      const reason = requireString(request.body.reason, "reason");

      return successResponse(
        rejectRequestService(actorId, requestId, reason),
        "Pengajuan berhasil ditolak.",
      );
    }

    case "reviews.approve": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const requestId = requireString(request.body.id, "id");

      return successResponse(
        approveRequestService(actorId, requestId),
        "Pengajuan berhasil disetujui.",
      );
    }

    case "attachments.upload": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const requestId = requireString(request.body.id, "id");

      const file = request.body.file as UploadFileInput;

      return successResponse(
        uploadRequestAttachmentService(actorId, requestId, file),
        "Attachment berhasil diupload.",
      );
    }

    case "attachments.delete": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const attachmentId = requireString(
        request.body.attachmentId,
        "attachmentId",
      );

      deleteRequestAttachmentService(actorId, attachmentId);

      return successResponse(null, "Attachment berhasil dihapus.");
    }

    // =========================
    // PAYMENT
    // =========================
    case "payments.process": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const requestId = requireString(request.body.id, "id");

      const payment = (request.body.payment ?? {}) as ProcessPaymentPayload;

      return successResponse(
        processPaymentService(actorId, requestId, payment),
        "Pembayaran berhasil diproses.",
      );
    }

    default:
      return errorResponse(
        `Action "${request.action}" tidak ditemukan.`,
        "ACTION_NOT_FOUND",
      );
  }
}

function assertPostRequest(request: ParsedApiRequest): void {
  if (request.method !== "POST") {
    throw createDomainError(
      "Action ini hanya menerima POST request.",
      "METHOD_NOT_ALLOWED",
    );
  }
}

function handleHealth() {
  const spreadsheet = getDatabase();

  return successResponse(
    {
      app: APP_CONFIG.appName,

      version: APP_CONFIG.version,

      status: "ok",

      database: spreadsheet.getName(),

      timestamp: nowIso(),
    },
    "Finance Request API aktif.",
  );
}

function handleListUsers() {
  const users = listUserRecords();

  return successResponse(users, `${users.length} pengguna ditemukan.`);
}

function handleListBusinessUnits() {
  const units = listBusinessUnitRecords();

  return successResponse(units, `${units.length} Unit Bisnis ditemukan.`);
}

function handleSchemaValidation() {
  const result = validateDatabaseSchema();

  if (!result.valid) {
    return errorResponse(
      "Schema database belum sesuai.",
      "INVALID_DATABASE_SCHEMA",
      result,
    );
  }

  return successResponse(result, "Schema database valid.");
}
