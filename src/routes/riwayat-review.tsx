import { createFileRoute } from "@tanstack/react-router";

import { ReviewHistoryPage } from "@/pages/ReviewHistoryPage";

export const Route = createFileRoute("/riwayat-review")({
  head: () => ({
    meta: [
      {
        title: "Riwayat Review | Finance Request Management System",
      },
      {
        name: "description",
        content: "Riwayat keputusan review pengajuan keuangan oleh Finance Reviewer.",
      },
    ],
  }),

  component: ReviewHistoryPage,
});
