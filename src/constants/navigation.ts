import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    to: "/",
    icon: "LayoutDashboard",
    roles: ["UNIT_USER", "FINANCE_REVIEWER", "FINANCE_PAYMENT", "ADMIN"],
    group: "Utama",
  },
  {
    label: "Pengajuan Saya",
    to: "/pengajuan",
    icon: "FileText",
    roles: ["UNIT_USER", "ADMIN"],
    group: "Utama",
  },
  {
    label: "Buat Pengajuan",
    to: "/pengajuan/baru",
    icon: "FilePlus2",
    roles: ["UNIT_USER"],
    group: "Utama",
  },
  {
    label: "Menunggu Review",
    to: "/review",
    icon: "ClipboardCheck",
    roles: ["FINANCE_REVIEWER", "ADMIN"],
    group: "Finance",
  },
  {
    label: "Proses Pembayaran",
    to: "/pembayaran",
    icon: "Banknote",
    roles: ["FINANCE_PAYMENT", "ADMIN"],
    group: "Finance",
  },
  {
    label: "Kelola Pengguna",
    to: "/pengguna",
    icon: "Users",
    roles: ["ADMIN"],
    group: "Administrasi",
  },
  {
    label: "Unit Bisnis",
    to: "/unit-bisnis",
    icon: "Building2",
    roles: ["ADMIN"],
    group: "Administrasi",
  },
  {
    label: "Pengaturan Sistem",
    to: "/pengaturan",
    icon: "Settings",
    roles: ["UNIT_USER", "FINANCE_REVIEWER", "FINANCE_PAYMENT", "ADMIN"],
    group: "Administrasi",
  },
];

export const NAV_GROUP_ORDER: NavItem["group"][] = ["Utama", "Finance", "Administrasi"];
