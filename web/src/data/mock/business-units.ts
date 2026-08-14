import type { BusinessUnit } from "@/types";

export const MOCK_BUSINESS_UNITS: BusinessUnit[] = [
  {
    id: "bu-01",
    code: "MAW-LOG",
    name: "MAW Logistik Nusantara",
    costCenter: "CC-1001",
    managerName: "Bagas Prasetyo",
    active: true,
  },
  {
    id: "bu-02",
    code: "MAW-ENG",
    name: "MAW Engineering Services",
    costCenter: "CC-1002",
    managerName: "Ratna Kusumawardani",
    active: true,
  },
  {
    id: "bu-03",
    code: "MAW-RET",
    name: "MAW Retail Indonesia",
    costCenter: "CC-1003",
    managerName: "Dimas Ardiansyah",
    active: true,
  },
  {
    id: "bu-04",
    code: "MAW-PRO",
    name: "MAW Property Development",
    costCenter: "CC-1004",
    managerName: "Siti Nurhaliza Putri",
    active: true,
  },
];
