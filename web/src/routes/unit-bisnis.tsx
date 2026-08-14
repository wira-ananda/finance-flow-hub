import { createFileRoute } from "@tanstack/react-router";

import { BusinessUnitPage } from "@/pages/BusinessUnitPage";

export const Route = createFileRoute("/unit-bisnis")({
  head: () => ({
    meta: [
      { title: "Unit Bisnis — Finance Request Management System" },
      {
        name: "description",
        content: "Unit bisnis terdaftar beserta ringkasan jumlah dan nilai pengajuan keuangannya.",
      },
      { property: "og:title", content: "Unit Bisnis" },
      { property: "og:description", content: "Ringkasan pengajuan keuangan per unit bisnis." },
    ],
  }),
  component: BusinessUnitPage,
});
