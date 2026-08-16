import { setTimeout as sleep } from "node:timers/promises";

import { createFileRoute } from "@tanstack/react-router";

import { getFinanceApiServerConfig } from "@/server/finance-api";
import { useAppSession } from "@/server/session";

const FINANCE_API_TIMEOUT_MS = 25_000;

const FINANCE_API_GET_MAX_ATTEMPTS = 2;

const FINANCE_API_RETRY_DELAY_MS = 350;

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
 * Mengambil error code paling dalam dari fetch/Undici error.
 */
function getNetworkErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const directCode = "code" in error && typeof error.code === "string" ? error.code : null;

  if (directCode) {
    return directCode;
  }

  if (
    "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null &&
    "code" in error.cause &&
    typeof error.cause.code === "string"
  ) {
    return error.cause.code;
  }

  return null;
}

/**
 * Menentukan apakah GET request layak dicoba ulang
 * ketika koneksi upstream terputus sementara.
 */
function isRetryableNetworkError(error: unknown): boolean {
  const code = getNetworkErrorCode(error);

  return [
    "ECONNRESET",
    "ETIMEDOUT",
    "EAI_AGAIN",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_SOCKET",
  ].includes(code ?? "");
}

/**
 * Menjalankan fetch ke Apps Script.
 *
 * GET boleh dicoba ulang satu kali karena idempotent.
 * POST tidak pernah di-retry otomatis untuk menghindari
 * duplikasi mutation ketika upstream sebenarnya sudah memproses request.
 */
async function fetchFinanceUpstream(
  url: URL,
  requestInit: RequestInit,
  method: "GET" | "POST",
): Promise<Response> {
  const maxAttempts = method === "GET" ? FINANCE_API_GET_MAX_ATTEMPTS : 1;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetch(url, {
        ...requestInit,

        signal: AbortSignal.timeout(FINANCE_API_TIMEOUT_MS),
      });
    } catch (error) {
      lastError = error;

      const shouldRetry =
        method === "GET" && attempt < maxAttempts && isRetryableNetworkError(error);

      if (!shouldRetry) {
        throw error;
      }

      console.warn("[Finance API Proxy] GET upstream gagal sementara, mencoba ulang.", {
        attempt,

        maxAttempts,

        code: getNetworkErrorCode(error),
      });

      await sleep(FINANCE_API_RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

/**
 * Proxy authenticated Finance API.
 *
 * Identity actor selalu berasal dari server session,
 * bukan dari actorId yang dikirim browser.
 */
async function proxyFinanceRequest(request: Request): Promise<Response> {
  const session = await useAppSession();

  const actorId = session.data.userId;

  if (!actorId) {
    return jsonError("Session pengguna tidak tersedia.", "UNAUTHENTICATED", 401);
  }

  const { apiUrl, serverKey } = getFinanceApiServerConfig();

  const method = request.method === "POST" ? "POST" : "GET";

  const incomingUrl = new URL(request.url);

  const targetUrl = new URL(apiUrl);

  const requestInit: RequestInit = {
    method,

    redirect: "follow",

    cache: "no-store",
  };

  if (method === "GET") {
    incomingUrl.searchParams.forEach((value, key) => {
      /*
       * actorId dan serverKey dari browser
       * tidak dipercaya.
       */
      if (key === "actorId" || key === "serverKey") {
        return;
      }

      targetUrl.searchParams.append(key, value);
    });

    targetUrl.searchParams.set("actorId", actorId);

    targetUrl.searchParams.set("serverKey", serverKey);

    requestInit.headers = {
      Accept: "application/json",
    };
  } else {
    let clientBody: Record<string, unknown>;

    try {
      const parsed = await request.json();

      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return jsonError("Request body tidak valid.", "INVALID_JSON", 400);
      }

      clientBody = parsed as Record<string, unknown>;
    } catch {
      return jsonError("Request body tidak valid.", "INVALID_JSON", 400);
    }

    /*
     * actorId dan serverKey ditempatkan paling akhir
     * agar value dari browser selalu dioverride.
     */
    const upstreamBody = JSON.stringify({
      ...clientBody,

      actorId,

      serverKey,
    });

    requestInit.headers = {
      "Content-Type": "text/plain;charset=UTF-8",

      Accept: "application/json",
    };

    requestInit.body = upstreamBody;
  }

  try {
    const upstreamResponse = await fetchFinanceUpstream(targetUrl, requestInit, method);

    const responseBody = await upstreamResponse.text();

    let parsed: unknown;

    try {
      parsed = JSON.parse(responseBody);
    } catch {
      console.error("[Finance API Proxy] Response non-JSON", {
        status: upstreamResponse.status,

        finalUrl: upstreamResponse.url,

        bodyLength: responseBody.length,
      });

      return jsonError(
        "Finance API mengembalikan response tidak valid.",
        "INVALID_FINANCE_API_RESPONSE",
        502,
      );
    }

    return Response.json(parsed, {
      status: upstreamResponse.status,

      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Finance API Proxy]", {
      method,

      code: getNetworkErrorCode(error),

      error,
    });

    return jsonError(
      method === "GET"
        ? "Finance API sementara tidak dapat dihubungi. Silakan coba lagi."
        : "Finance API tidak dapat mengonfirmasi hasil proses. Jangan ulangi aksi sebelum mengecek status pengajuan.",
      "FINANCE_API_UNREACHABLE",
      502,
    );
  }
}

export const Route = createFileRoute("/api/finance")({
  server: {
    handlers: {
      GET: async ({ request }) => proxyFinanceRequest(request),

      POST: async ({ request }) => proxyFinanceRequest(request),
    },
  },
});
