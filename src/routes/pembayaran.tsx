import { createFileRoute } from "@tanstack/react-router";

import { PaymentQueuePage } from "@/pages/PaymentQueuePage";

export const Route = createFileRoute("/pembayaran")({
  head: () => ({
    meta: [
      { title: "Proses Pembayaran — Finance Request Management System" },
      {
        name: "description",
        content:
          "Kelola pembayaran pengajuan yang telah disetujui beserta unggahan bukti transfer.",
      },
      { property: "og:title", content: "Proses Pembayaran Finance" },
      {
        property: "og:description",
        content: "Proses pembayaran pengajuan disetujui dan lampirkan bukti transfer.",
      },
    ],
  }),
  component: PaymentQueuePage,
});
