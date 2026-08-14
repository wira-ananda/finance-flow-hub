import { createFileRoute } from "@tanstack/react-router";

import { RequestListPage } from "@/pages/RequestListPage";

export const Route = createFileRoute("/pengajuan/")({
  head: () => ({
    meta: [
      { title: "Daftar Pengajuan — Finance Request Management System" },
      {
        name: "description",
        content:
          "Telusuri seluruh pengajuan keuangan berdasarkan status, unit bisnis, dan nominal pengajuan.",
      },
      { property: "og:title", content: "Daftar Pengajuan Keuangan" },
      {
        property: "og:description",
        content: "Telusuri pengajuan keuangan berdasarkan status dan unit bisnis.",
      },
    ],
  }),
  component: RequestListPage,
});
