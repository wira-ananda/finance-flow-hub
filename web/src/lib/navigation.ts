import type { NavItem, NavigationPath, UserRole } from "@/types";

export interface BreadcrumbItem {
  label: string;
  to?: NavigationPath;
}

/**
 * Mengambil menu aktif yang paling spesifik.
 *
 * Contoh:
 * /pengajuan/baru tidak akan membuat /pengajuan ikut aktif.
 */
export function getActiveNavigationPath(
  pathname: string,
  role: UserRole,
  items: NavItem[],
): NavigationPath | null {
  const matches = items
    .filter((item) => {
      if (item.to === "/") {
        return pathname === "/";
      }

      return pathname === item.to || pathname.startsWith(`${item.to}/`);
    })
    .sort((first, second) => second.to.length - first.to.length);

  if (matches[0]) {
    return matches[0].to;
  }

  /*
   * Detail request selalu berada di /pengajuan/:id,
   * tetapi konteks navigasinya berbeda untuk tiap role.
   */
  if (pathname.startsWith("/pengajuan/") && pathname !== "/pengajuan/baru") {
    const fallbackByRole: Partial<Record<UserRole, NavigationPath>> = {
      UNIT_USER: "/pengajuan",
      FINANCE_REVIEWER: "/review",
      FINANCE_PAYMENT: "/pembayaran",
      ADMIN: "/pengajuan",
    };

    const fallback = fallbackByRole[role];

    if (fallback && items.some((item) => item.to === fallback)) {
      return fallback;
    }
  }

  return null;
}

/**
 * Menyusun breadcrumb berdasarkan role dan pathname aktif.
 */
export function getBreadcrumbItems(
  pathname: string,
  role: UserRole,
  items: NavItem[],
): BreadcrumbItem[] {
  if (pathname === "/") {
    return [
      {
        label: "Dashboard",
      },
    ];
  }

  const exactMatch = items.find((item) => item.to === pathname);

  if (exactMatch) {
    return [
      {
        label: "Dashboard",
        to: "/",
      },
      {
        label: exactMatch.label,
      },
    ];
  }

  if (pathname.startsWith("/pengajuan/") && pathname !== "/pengajuan/baru") {
    const activePath = getActiveNavigationPath(pathname, role, items);

    const parent = items.find((item) => item.to === activePath);

    return [
      {
        label: "Dashboard",
        to: "/",
      },
      ...(parent
        ? [
            {
              label: parent.label,
              to: parent.to,
            },
          ]
        : []),
      {
        label: "Detail Pengajuan",
      },
    ];
  }

  const nestedMatch = [...items]
    .filter((item) => item.to !== "/" && pathname.startsWith(`${item.to}/`))
    .sort((first, second) => second.to.length - first.to.length)[0];

  return [
    {
      label: "Dashboard",
      to: "/",
    },
    {
      label: nestedMatch?.label ?? "Detail",
    },
  ];
}
