function handleRequest(
  method,
  event,
) {
  try {
    const request =
      parseRequest(
        method,
        event,
      );

    return routeRequest(
      request,
    );
  } catch (error) {
    console.error(
      error &&
        error.stack
        ? error.stack
        : error,
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan pada server.",
      "INTERNAL_ERROR",
    );
  }
}

function parseRequest(
  method,
  event,
) {
  const query =
    event && event.parameter
      ? event.parameter
      : {};

  const body =
    method === "POST"
      ? parseJsonBody(event)
      : {};

  const action =
    query.action ||
    body.action ||
    "health";

  return {
    method: method,
    action: String(action),
    query: query,
    body: body,
  };
}

function parseJsonBody(event) {
  if (
    !event ||
    !event.postData ||
    !event.postData.contents
  ) {
    return {};
  }

  try {
    return JSON.parse(
      event.postData.contents,
    );
  } catch (error) {
    throw new Error(
      "Request body harus berupa JSON yang valid.",
    );
  }
}

function routeRequest(request) {
  switch (request.action) {
    case "health":
      return handleHealth();

    case "schema.validate":
      return handleSchemaValidation();

    case "users.list":
      return handleListUsers();

    case "business-units.list":
      return handleListBusinessUnits();

    default:
      return errorResponse(
        `Action "${request.action}" tidak ditemukan.`,
        "ACTION_NOT_FOUND",
      );
  }
}

function handleHealth() {
  const spreadsheet =
    getDatabase();

  return successResponse(
    {
      app: APP_CONFIG.appName,
      version: APP_CONFIG.version,
      status: "ok",
      database: spreadsheet.getName(),
      timestamp: new Date().toISOString(),
    },
    "Finance Request API aktif.",
  );
}

function handleListUsers() {
  const users =
    listUserRecords();

  return successResponse(
    users,
    `${users.length} pengguna ditemukan.`,
  );
}

function handleListBusinessUnits() {
  const units =
    listBusinessUnitRecords();

  return successResponse(
    units,
    `${units.length} Unit Bisnis ditemukan.`,
  );
}

function handleSchemaValidation() {
  const result =
    validateDatabaseSchema();

  if (!result.valid) {
    return errorResponse(
      "Schema database belum sesuai.",
      "INVALID_DATABASE_SCHEMA",
      result,
    );
  }

  return successResponse(
    result,
    "Schema database valid.",
  );
}