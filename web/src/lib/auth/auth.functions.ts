import { createServerFn } from "@tanstack/react-start";

import type { User } from "@/types";

function createInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Membaca user yang sedang login dari HttpOnly server session.
 *
 * Function declaration ini boleh di-import dari client.
 * Isi handler tetap hanya dieksekusi pada server oleh TanStack Start.
 */
export const getCurrentSessionUserFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<User | null> => {
  /*
   * Dynamic import sengaja berada di dalam server handler
   * supaya module server-only tidak menjadi dependency
   * client bundle.
   */
  const { useAppSession } = await import("@/server/session");

  const session = await useAppSession();

  const { userId, email, name, role, jobTitle, businessUnitId } = session.data;

  if (!userId || !email || !name || !role) {
    return null;
  }

  return {
    id: userId,

    name,

    email,

    role,

    jobTitle: jobTitle ?? "",

    businessUnitId: businessUnitId ?? null,

    initials: createInitials(name),

    active: true,
  };
});

/**
 * Menghapus HttpOnly session pengguna.
 */
export const logoutFn = createServerFn({
  method: "POST",
}).handler(async () => {
  /*
   * Tetap berada di dalam server-function boundary.
   */
  const { useAppSession } = await import("@/server/session");

  const session = await useAppSession();

  await session.clear();

  return {
    success: true,
  };
});
