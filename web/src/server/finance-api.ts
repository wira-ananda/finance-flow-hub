import type { ApiResponse } from "@/lib/api/types";

import type { ApiUserRecord } from "@/types/finance-api";

interface FinanceApiServerConfig {
  apiUrl: string;

  serverKey: string;
}

function requireServerEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} belum dikonfigurasi.`);
  }

  return value;
}

/**
 * Mengambil konfigurasi private Finance API.
 */
export function getFinanceApiServerConfig(): FinanceApiServerConfig {
  return {
    apiUrl: requireServerEnvironment("FINANCE_API_URL"),

    serverKey: requireServerEnvironment("FINANCE_API_SERVER_KEY"),
  };
}

async function parseFinanceApiResponse<T>(response: Response): Promise<T> {
  const body = await response.text();

  let payload: ApiResponse<T>;

  try {
    payload = JSON.parse(body) as ApiResponse<T>;
  } catch {
    throw new Error("Finance API mengembalikan response non-JSON.");
  }

  if (!payload.success) {
    throw new Error(payload.message ?? "Finance API gagal memproses request.");
  }

  return payload.data as T;
}

/**
 * GET ke Apps Script dari server TanStack.
 */
export async function financeServerGet<T>(
  action: string,
  params: Record<string, string> = {},
): Promise<T> {
  const { apiUrl, serverKey } = getFinanceApiServerConfig();

  const url = new URL(apiUrl);

  url.searchParams.set("action", action);

  url.searchParams.set("serverKey", serverKey);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    method: "GET",

    redirect: "follow",

    cache: "no-store",

    headers: {
      Accept: "application/json",
    },
  });

  return parseFinanceApiResponse<T>(response);
}

/**
 * Normalisasi nilai is_active dari Google Sheet.
 */
export function isApiUserActive(value: ApiUserRecord["is_active"]): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return ["true", "1", "yes", "aktif"].includes(value.trim().toLowerCase());
}

/**
 * Mencari internal Finance user berdasarkan email Google.
 */
export async function findFinanceUserByEmail(email: string): Promise<ApiUserRecord | null> {
  const users = await financeServerGet<ApiUserRecord[]>("users.list");

  const normalizedEmail = email.trim().toLowerCase();

  return users.find((user) => user.email.trim().toLowerCase() === normalizedEmail) ?? null;
}
