interface ApiErrorPayload {
  code: string;
  details: unknown | null;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string | null;
  error: ApiErrorPayload | null;
}

function successResponse<T>(
  data: T,
  message?: string,
): GoogleAppsScript.Content.TextOutput {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message: message ?? null,
    error: null,
  };

  return jsonResponse(payload);
}

function errorResponse(
  message: string,
  errorCode = "INTERNAL_ERROR",
  details?: unknown,
): GoogleAppsScript.Content.TextOutput {
  const payload: ApiResponse<null> = {
    success: false,
    data: null,
    message,
    error: {
      code: errorCode,
      details: details ?? null,
    },
  };

  return jsonResponse(payload);
}

function jsonResponse(payload: unknown): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
