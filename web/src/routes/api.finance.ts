import { createFileRoute } from "@tanstack/react-router";

import { getFinanceApiServerConfig } from "@/server/finance-api";

import { useAppSession } from "@/server/session";

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
       * actorId dan serverKey dari browser tidak dipercaya.
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
     * Nilai ini ditempatkan paling akhir sehingga actorId/serverKey
     * dari browser selalu dioverride.
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
    const upstreamResponse = await fetch(targetUrl, requestInit);

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
    console.error("[Finance API Proxy]", error);

    return jsonError("Finance API tidak dapat dihubungi.", "FINANCE_API_UNREACHABLE", 502);
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
