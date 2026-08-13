import type { User } from "@/types";

export const MOCK_USERS: User[] = [
  {
    id: "usr-01",
    name: "Andini Ayu Lestari",
    email: "andini.lestari@mawgroup.co.id",
    role: "UNIT_USER",
    jobTitle: "Staf Administrasi Unit",
    businessUnitId: "bu-01",
    initials: "AL",
    active: true,
  },
  {
    id: "usr-02",
    name: "Rizky Hidayat",
    email: "rizky.hidayat@mawgroup.co.id",
    role: "UNIT_USER",
    jobTitle: "Supervisor Operasional",
    businessUnitId: "bu-02",
    initials: "RH",
    active: true,
  },
  {
    id: "usr-03",
    name: "Fitriani Maharani",
    email: "fitriani.maharani@mawgroup.co.id",
    role: "FINANCE_REVIEWER",
    jobTitle: "Finance Reviewer",
    businessUnitId: null,
    initials: "FM",
    active: true,
  },
  {
    id: "usr-04",
    name: "Hendra Wijaya",
    email: "hendra.wijaya@mawgroup.co.id",
    role: "FINANCE_PAYMENT",
    jobTitle: "Finance Payment Officer",
    businessUnitId: null,
    initials: "HW",
    active: true,
  },
  {
    id: "usr-05",
    name: "Wira Ananda",
    email: "wira.ananda@mawgroup.co.id",
    role: "ADMIN",
    jobTitle: "System Administrator",
    businessUnitId: null,
    initials: "WA",
    active: true,
  },
  {
    id: "usr-06",
    name: "Nadia Puspita",
    email: "nadia.puspita@mawgroup.co.id",
    role: "UNIT_USER",
    jobTitle: "Staf Keuangan Unit",
    businessUnitId: "bu-03",
    initials: "NP",
    active: false,
  },
];

/** Pengguna default yang aktif untuk masing-masing role (mock session). */
export const DEFAULT_USER_BY_ROLE = {
  UNIT_USER: "usr-01",
  FINANCE_REVIEWER: "usr-03",
  FINANCE_PAYMENT: "usr-04",
  ADMIN: "usr-05",
} as const;
