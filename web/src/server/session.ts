import { useSession } from "@tanstack/react-start/server";

import type { UserRole } from "@/types";

export interface FinanceSessionData {
  userId?: string;

  googleSub?: string;

  email?: string;

  name?: string;

  role?: UserRole;

  jobTitle?: string;

  businessUnitId?: string | null;
}

const SESSION_MAX_AGE = 8 * 60 * 60;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error("SESSION_SECRET belum dikonfigurasi.");
  }

  if (secret.length < 32) {
    throw new Error("SESSION_SECRET minimal 32 karakter.");
  }

  return secret;
}

/**
 * Session authentication utama Finance Request System.
 *
 * Cookie hanya dapat diakses server dan berlaku selama 8 jam.
 */
export function useAppSession() {
  return useSession<FinanceSessionData>({
    name: "finance-session",

    password: getSessionSecret(),

    cookie: {
      httpOnly: true,

      sameSite: "lax",

      secure: process.env.NODE_ENV === "production",

      path: "/",

      maxAge: SESSION_MAX_AGE,
    },
  });
}
