import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  // =========================
  // GENERAL
  // =========================

  {
    label: "Dashboard",
    to: "/",
    icon: "LayoutDashboard",
    roles: ["UNIT_USER", "FINANCE_REVIEWER", "FINANCE_PAYMENT", "ADMIN"],
    group: "Utama",
  },

  // =========================
  // UNIT USER
  // =========================

  {
    label: "Pengajuan Saya",
    to: "/pengajuan",
    icon: "FileText",
    roles: ["UNIT_USER"],
    group: "Utama",
  },

  // =========================
  // FINANCE REVIEWER
  // =========================

  {
    label: "Antrean Review",
    to: "/review",
    icon: "ClipboardCheck",
    roles: ["FINANCE_REVIEWER"],
    group: "Finance",
  },

  {
    label: "Riwayat Review",
    to: "/riwayat-review",
    icon: "History",
    roles: ["FINANCE_REVIEWER"],
    group: "Finance",
  },

  // =========================
  // FINANCE PAYMENT
  // =========================

  {
    label: "Proses Pembayaran",
    to: "/pembayaran",
    icon: "Banknote",
    roles: ["FINANCE_PAYMENT"],
    group: "Finance",
  },

  // =========================
  // ADMIN
  // =========================

  {
    label: "Seluruh Pengajuan",
    to: "/pengajuan",
    icon: "Files",
    roles: ["ADMIN"],
    group: "Utama",
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
    roles: ["ADMIN"],
    group: "Administrasi",
  },
];

export const NAV_GROUP_ORDER: NavItem["group"][] = ["Utama", "Finance", "Administrasi"];
