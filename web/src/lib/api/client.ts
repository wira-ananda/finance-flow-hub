import { ApiError, type ApiResponse } from "./types";

type QueryValue = string | number | boolean | null | undefined;

type QueryParams = Record<string, QueryValue>;

/*
 * Browser hanya berkomunikasi dengan server TanStack Start
 * pada origin yang sama.
 */
const API_PATH = "/api/finance";

/**
 * Membentuk URL Finance API proxy untuk GET request.
 */
function buildApiUrl(action: string, params: QueryParams = {}): string {
  const searchParams = new URLSearchParams();

  searchParams.set("action", action);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    searchParams.set(key, String(value));
  });

  return `${API_PATH}?${searchParams.toString()}`;
}

/**
 * Membaca response contract standar dari Finance API.
 */
async function parseApiResponse<T>(response: Response): Promise<T> {
  let payload: ApiResponse<T>;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      "Server mengembalikan response yang tidak valid.",
      "INVALID_API_RESPONSE",
      null,
      response.status,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      payload.message ?? `HTTP request gagal dengan status ${response.status}.`,

      payload.error?.code ?? "HTTP_ERROR",

      payload.error?.details ?? null,

      response.status,
    );
  }

  if (!payload.success) {
    throw new ApiError(
      payload.message ?? "Terjadi kesalahan pada Finance API.",

      payload.error?.code ?? "API_ERROR",

      payload.error?.details ?? null,

      response.status,
    );
  }

  return payload.data as T;
}

/**
 * GET Finance API melalui same-origin TanStack Start proxy.
 */
export async function apiGet<T>(
  action: string,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(buildApiUrl(action, params), {
    method: "GET",

    signal,

    cache: "no-store",

    headers: {
      Accept: "application/json",
    },
  });

  return parseApiResponse<T>(response);
}

/**
 * POST Finance API melalui same-origin TanStack Start proxy.
 */
export async function apiPost<T, TBody extends Record<string, unknown>>(
  action: string,
  body: TBody,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(API_PATH, {
    method: "POST",

    headers: {
      Accept: "application/json",

      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      action,
      ...body,
    }),

    signal,

    cache: "no-store",
  });

  return parseApiResponse<T>(response);
}
