function successResponse(data, message) {
  return jsonResponse({
    success: true,
    data: data === undefined ? null : data,
    message: message || null,
  });
}

function errorResponse(message, errorCode, details) {
  return jsonResponse({
    success: false,
    data: null,
    message: message || "Terjadi kesalahan pada server.",
    errorCode: errorCode || "INTERNAL_ERROR",
    details: details || null,
  });
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(
    JSON.stringify(payload),
  ).setMimeType(ContentService.MimeType.JSON);
}