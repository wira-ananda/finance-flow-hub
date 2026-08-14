import type { UserRole } from "@/types";

const ALL_ROLES: UserRole[] = ["UNIT_USER", "FINANCE_REVIEWER", "FINANCE_PAYMENT", "ADMIN"];

/**
 * Menormalisasi pathname agar pemeriksaan permission route konsisten.
 */
function normalizePathname(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
}

/**
 * Memeriksa apakah role boleh membuka pathname tertentu.
 *
 * Ini merupakan development/mock guard pada sisi frontend.
 * Authorization production tetap harus divalidasi oleh backend.
 */
export function canAccessPath(role: UserRole, pathname: string): boolean {
  const path = normalizePathname(pathname);

  if (path === "/") {
    return true;
  }

  if (path === "/pengajuan") {
    return ["UNIT_USER", "ADMIN"].includes(role);
  }

  if (path === "/pengajuan/baru") {
    return role === "UNIT_USER";
  }

  /*
   * Detail request menggunakan /pengajuan/:id untuk seluruh role.
   * Visibility request tetap divalidasi lagi oleh canViewRequest().
   */
  if (path.startsWith("/pengajuan/")) {
    return ALL_ROLES.includes(role);
  }

  if (path === "/review" || path === "/riwayat-review") {
    return role === "FINANCE_REVIEWER";
  }

  if (path === "/pembayaran") {
    return role === "FINANCE_PAYMENT";
  }

  if (path === "/pengguna" || path === "/unit-bisnis" || path === "/pengaturan") {
    return role === "ADMIN";
  }

  /*
   * Path tidak dikenal dibiarkan lewat agar TanStack Router
   * dapat menampilkan halaman 404.
   */
  return true;
}
