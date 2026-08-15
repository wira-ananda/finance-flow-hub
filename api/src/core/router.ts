interface ParsedApiRequest {
  method: "GET" | "POST";
  action: string;
  query: Record<string, string>;
  body: Record<string, unknown>;
}

function handleRequest(
  method: "GET" | "POST",
  event: GoogleAppsScript.Events.DoGet | GoogleAppsScript.Events.DoPost,
): GoogleAppsScript.Content.TextOutput {
  try {
    const request = parseRequest(method, event);

    console.log(`[API] ${request.method} ${request.action}`);

    return routeRequest(request);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan pada server.";

    console.error(
      error instanceof Error ? (error.stack ?? error.message) : error,
    );

    return errorResponse(message, getErrorCode(error));
  }
}

function parseRequest(
  method: "GET" | "POST",
  event: GoogleAppsScript.Events.DoGet | GoogleAppsScript.Events.DoPost,
): ParsedApiRequest {
  const query =
    event && "parameter" in event && event.parameter
      ? (event.parameter as Record<string, string>)
      : {};

  const body = method === "POST" ? parseJsonBody(event) : {};

  const rawAction = query.action ?? body.action;

  const action =
    rawAction === undefined || rawAction === null
      ? method === "GET"
        ? "health"
        : ""
      : String(rawAction).trim();

  if (!action) {
    throw createDomainError("Action API wajib diisi.", "ACTION_REQUIRED");
  }

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
  if (!("postData" in event) || !event.postData?.contents) {
    return {};
  }

  try {
    const parsed = JSON.parse(event.postData.contents) as unknown;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("Body bukan object.");
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw createDomainError(
      "Request body harus berupa JSON object yang valid.",
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

function requireObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw createDomainError(
      `${field} wajib berupa object.`,
      "VALIDATION_ERROR",
    );
  }

  return value as Record<string, unknown>;
}

function routeRequest(
  request: ParsedApiRequest,
): GoogleAppsScript.Content.TextOutput {
  switch (request.action) {
    // ==================================================
    // FOUNDATION
    // ==================================================

    case "health": {
      assertGetRequest(request);

      return handleHealth();
    }

    case "schema.validate": {
      assertGetRequest(request);

      return handleSchemaValidation();
    }

    case "users.list": {
      assertGetRequest(request);

      return handleListUsers();
    }

    case "business-units.list": {
      assertGetRequest(request);

      return handleListBusinessUnits();
    }

    // ==================================================
    // REQUEST
    // ==================================================

    case "requests.list": {
      assertGetRequest(request);

      const actorId = requireString(request.query.actorId, "actorId");

      return successResponse(
        listRequestsForActor(actorId),
        "Daftar pengajuan berhasil dimuat.",
      );
    }

    case "requests.get": {
      assertGetRequest(request);

      const actorId = requireString(request.query.actorId, "actorId");

      const requestId = requireString(request.query.id, "id");

      return successResponse(
        getRequestDetailForActor(actorId, requestId),
        "Detail pengajuan berhasil dimuat.",
      );
    }

    case "requests.create": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const payload = requireObject(
        request.body.request,
        "request",
      ) as unknown as CreateRequestPayload;

      return successResponse(
        createRequestService(actorId, payload),
        "Pengajuan berhasil dibuat.",
      );
    }

    case "requests.update": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const requestId = requireString(request.body.id, "id");

      const payload = requireObject(
        request.body.request,
        "request",
      ) as unknown as RequestInput;

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

    // ==================================================
    // REVIEW
    // ==================================================

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
        "Pengajuan berhasil disetujui dan Surat Persetujuan berhasil dibuat.",
      );
    }

    // ==================================================
    // ATTACHMENTS
    // ==================================================

    case "attachments.upload": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const requestId = requireString(request.body.id, "id");

      const file = requireObject(
        request.body.file,
        "file",
      ) as unknown as UploadFileInput;

      return successResponse(
        uploadRequestAttachmentService(actorId, requestId, file),
        "Dokumen pendukung berhasil diunggah.",
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

      return successResponse(null, "Dokumen pendukung berhasil dihapus.");
    }

    // ==================================================
    // PAYMENT
    // ==================================================

    case "payments.process": {
      assertPostRequest(request);

      const actorId = requireString(request.body.actorId, "actorId");

      const requestId = requireString(request.body.id, "id");

      const payment = requireObject(
        request.body.payment,
        "payment",
      ) as unknown as ProcessPaymentPayload;

      return successResponse(
        processPaymentService(actorId, requestId, payment),
        "Pembayaran berhasil diproses.",
      );
    }

    // ==================================================
    // FALLBACK
    // ==================================================

    default:
      return errorResponse(
        `Action "${request.action}" tidak ditemukan.`,
        "ACTION_NOT_FOUND",
      );
  }
}

function assertGetRequest(request: ParsedApiRequest): void {
  if (request.method !== "GET") {
    throw createDomainError(
      "Action ini hanya menerima GET request.",
      "METHOD_NOT_ALLOWED",
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

function handleHealth(): GoogleAppsScript.Content.TextOutput {
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

function handleListUsers(): GoogleAppsScript.Content.TextOutput {
  const users = listUserRecords();

  return successResponse(users, `${users.length} pengguna ditemukan.`);
}

function handleListBusinessUnits(): GoogleAppsScript.Content.TextOutput {
  const units = listBusinessUnitRecords();

  return successResponse(units, `${units.length} Unit Bisnis ditemukan.`);
}

function handleSchemaValidation(): GoogleAppsScript.Content.TextOutput {
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
