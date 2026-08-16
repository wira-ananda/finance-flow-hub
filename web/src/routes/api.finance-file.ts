import { Buffer } from "node:buffer";

import { createFileRoute } from "@tanstack/react-router";

import { financeServerGet } from "@/server/finance-api";
import { useAppSession } from "@/server/session";

interface RequestFilePayload {
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeKb: number;
  base64: string;
}

function jsonError(message: string, code: string, status: number): Response {
  return Response.json(
    {
      success: false,
      data: null,
      message,
      error: {
        code,
        details: null,
      },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

/**
 * Membersihkan nama file sebelum dipakai pada Content-Disposition header.
 */
function sanitizeDownloadFileName(fileName: string): string {
  return (
    fileName
      .replace(/[^\x20-\x7E]/g, "_")
      .replace(/["\r\n\\/]/g, "_")
      .slice(0, 160) || "finance-file"
  );
}

async function handleFinanceFileRequest(request: Request): Promise<Response> {
  const session = await useAppSession();
  const actorId = session.data.userId;

  if (!actorId) {
    return jsonError("Session pengguna tidak tersedia.", "UNAUTHENTICATED", 401);
  }

  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId")?.trim() ?? "";
  const fileId = url.searchParams.get("fileId")?.trim() ?? "";
  const disposition =
    url.searchParams.get("disposition") === "attachment" ? "attachment" : "inline";

  if (!requestId || !fileId) {
    return jsonError("requestId dan fileId wajib diisi.", "VALIDATION_ERROR", 400);
  }

  try {
    const file = await financeServerGet<RequestFilePayload>("files.get", {
      actorId,
      requestId,
      fileId,
    });

    const bytes = Uint8Array.from(Buffer.from(file.base64, "base64"));
    const safeFileName = sanitizeDownloadFileName(file.fileName);

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `${disposition}; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(
          file.fileName,
        )}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[Finance File]", error);

    return jsonError(
      error instanceof Error ? error.message : "File gagal dimuat.",
      "FINANCE_FILE_ERROR",
      502,
    );
  }
}

export const Route = createFileRoute("/api/finance-file")({
  server: {
    handlers: {
      GET: async ({ request }) => handleFinanceFileRequest(request),
    },
  },
});
