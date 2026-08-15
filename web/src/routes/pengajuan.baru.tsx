import { createFileRoute } from "@tanstack/react-router";

import { CreateRequestPage } from "@/pages/CreateRequestPage";

interface CreateRequestSearch {
  edit?: string;
}

export const Route = createFileRoute("/pengajuan/baru")({
  validateSearch: (search: Record<string, unknown>): CreateRequestSearch => ({
    ...(typeof search.edit === "string" && search.edit.trim()
      ? {
          edit: search.edit.trim(),
        }
      : {}),
  }),

  head: () => ({
    meta: [
      {
        title: "Buat Pengajuan — Finance Request Management System",
      },
      {
        name: "description",
        content:
          "Formulir pengajuan keuangan unit bisnis: detail kebutuhan, nominal, penerima, dan dokumen pendukung.",
      },
      {
        property: "og:title",
        content: "Buat Pengajuan Keuangan",
      },
      {
        property: "og:description",
        content: "Ajukan kebutuhan dana unit bisnis kepada tim Finance.",
      },
    ],
  }),

  component: CreateRequestRoute,
});

function CreateRequestRoute() {
  const { edit } = Route.useSearch();

  return <CreateRequestPage editRequestId={edit ?? null} />;
}
