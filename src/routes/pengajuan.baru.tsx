import { createFileRoute } from "@tanstack/react-router";

import { CreateRequestPage } from "@/pages/CreateRequestPage";

export const Route = createFileRoute("/pengajuan/baru")({
  head: () => ({
    meta: [
      { title: "Buat Pengajuan — Finance Request Management System" },
      {
        name: "description",
        content:
          "Formulir pengajuan keuangan unit bisnis: detail kebutuhan, nominal, penerima, dan dokumen pendukung.",
      },
      { property: "og:title", content: "Buat Pengajuan Keuangan" },
      {
        property: "og:description",
        content: "Ajukan kebutuhan dana unit bisnis kepada tim Finance.",
      },
    ],
  }),
  component: CreateRequestPage,
});
