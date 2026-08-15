import { OAuth2Client } from "google-auth-library";

import { createFileRoute } from "@tanstack/react-router";

import { findFinanceUserByEmail, isApiUserActive } from "@/server/finance-api";

import { useAppSession } from "@/server/session";

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (key !== name) {
      continue;
    }

    return decodeURIComponent(valueParts.join("="));
  }

  return null;
}

function sanitizeRedirect(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function redirectToLoginError(request: Request, errorCode: string): Response {
  const url = new URL("/login", request.url);

  url.searchParams.set("error", errorCode);

  return createRedirectResponse(url);
}

async function handleGoogleLogin(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();

    const credential = formData.get("credential");

    const formCsrfToken = formData.get("g_csrf_token");

    const cookieCsrfToken = getCookieValue(request, "g_csrf_token");

    if (typeof credential !== "string" || !credential) {
      return redirectToLoginError(request, "GOOGLE_CREDENTIAL_MISSING");
    }

    /*
     * Google Identity Services mengirim CSRF token dalam
     * cookie dan form body. Keduanya wajib sama.
     */
    if (
      typeof formCsrfToken !== "string" ||
      !formCsrfToken ||
      !cookieCsrfToken ||
      formCsrfToken !== cookieCsrfToken
    ) {
      return redirectToLoginError(request, "GOOGLE_CSRF_FAILED");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();

    if (!clientId) {
      return redirectToLoginError(request, "AUTH_CONFIGURATION_ERROR");
    }

    const googleClient = new OAuth2Client();

    /*
     * verifyIdToken memvalidasi signature, audience,
     * issuer, dan expiry ID token.
     */
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,

      audience: clientId,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return redirectToLoginError(request, "GOOGLE_IDENTITY_INVALID");
    }

    /*
     * Optional untuk Google Workspace perusahaan.
     *
     * Kalau GOOGLE_WORKSPACE_DOMAIN tidak diisi,
     * validasi domain dilewati.
     */
    const allowedDomain = process.env.GOOGLE_WORKSPACE_DOMAIN?.trim().toLowerCase();

    if (allowedDomain && payload.hd?.toLowerCase() !== allowedDomain) {
      return redirectToLoginError(request, "GOOGLE_DOMAIN_NOT_ALLOWED");
    }

    const financeUser = await findFinanceUserByEmail(payload.email);

    if (!financeUser) {
      return redirectToLoginError(request, "ACCOUNT_NOT_REGISTERED");
    }

    if (!isApiUserActive(financeUser.is_active)) {
      return redirectToLoginError(request, "ACCOUNT_INACTIVE");
    }

    const session = await useAppSession();

    await session.update({
      /*
       * googleSub adalah stable identity Google.
       */
      googleSub: payload.sub,

      /*
       * Internal ID tetap ID user Finance.
       */
      userId: financeUser.id,

      email: financeUser.email,

      name: financeUser.name,

      role: financeUser.role,

      jobTitle: financeUser.job_title,

      businessUnitId: financeUser.business_unit_id || null,
    });

    const redirectPath = sanitizeRedirect(formData.get("state"));

    return createRedirectResponse(new URL(redirectPath, request.url));
  } catch (error) {
    console.error("[Google Login]", error);

    return redirectToLoginError(request, "GOOGLE_LOGIN_FAILED");
  }
}

export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      POST: async ({ request }) => handleGoogleLogin(request),
    },
  },
});

function createRedirectResponse(url: URL | string, status = 303): Response {
  return new Response(null, {
    status,

    headers: {
      Location: typeof url === "string" ? url : url.toString(),

      "Cache-Control": "no-store",
    },
  });
}
