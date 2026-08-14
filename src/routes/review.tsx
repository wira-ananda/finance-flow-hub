import { createFileRoute } from "@tanstack/react-router";

import { ReviewQueuePage } from "@/pages/ReviewQueuePage";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Antrean Review — Finance Request Management System" },
      {
        name: "description",
        content:
          "Antrean review tim Finance: tinjau, minta revisi, setujui, atau tolak pengajuan keuangan unit bisnis.",
      },
      { property: "og:title", content: "Antrean Review Finance" },
      {
        property: "og:description",
        content: "Tinjau dan putuskan pengajuan keuangan yang masuk.",
      },
    ],
  }),
  component: ReviewQueuePage,
});
