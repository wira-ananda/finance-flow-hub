import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "@/pages/SettingsPage";

export const Route = createFileRoute("/pengaturan")({
  head: () => ({
    meta: [
      { title: "Pengaturan Sistem — Finance Request Management System" },
      {
        name: "description",
        content: "Atur mode tampilan, role pengembangan, dan lihat referensi status pengajuan.",
      },
      { property: "og:title", content: "Pengaturan Sistem" },
      { property: "og:description", content: "Preferensi tampilan dan konteks akses pengguna." },
    ],
  }),
  component: SettingsPage,
});
