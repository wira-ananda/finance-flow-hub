import { createFileRoute } from "@tanstack/react-router";

import { DashboardPage } from "@/pages/DashboardPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Dashboard | Finance Request Management System",
      },
      {
        name: "description",
        content:
          "Ringkasan pengajuan keuangan lintas unit bisnis: status review, persetujuan, dan pembayaran dalam satu dashboard internal.",
      },
      {
        property: "og:title",
        content: "Dashboard | Finance Request Management System",
      },
      {
        property: "og:description",
        content: "Pantau status pengajuan keuangan unit bisnis secara terpusat.",
      },
    ],
  }),

  component: DashboardPage,
});
