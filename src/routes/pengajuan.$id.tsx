import { createFileRoute } from "@tanstack/react-router";

import { RequestDetailPage } from "@/pages/RequestDetailPage";

export const Route = createFileRoute("/pengajuan/$id")({
  head: () => ({
    meta: [
      { title: "Detail Pengajuan — Finance Request Management System" },
      {
        name: "description",
        content:
          "Detail pengajuan keuangan: informasi penerima, dokumen pendukung, surat persetujuan, dan riwayat aktivitas.",
      },
      { property: "og:title", content: "Detail Pengajuan Keuangan" },
      {
        property: "og:description",
        content: "Lihat riwayat review, persetujuan, dan bukti transfer pengajuan.",
      },
    ],
  }),
  component: RequestDetailRoute,
});

function RequestDetailRoute() {
  const { id } = Route.useParams();
  return <RequestDetailPage id={id} />;
}
