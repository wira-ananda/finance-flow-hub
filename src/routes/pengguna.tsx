import { createFileRoute } from "@tanstack/react-router";

import { UserManagementPage } from "@/pages/UserManagementPage";

export const Route = createFileRoute("/pengguna")({
  head: () => ({
    meta: [
      { title: "Kelola Pengguna — Finance Request Management System" },
      {
        name: "description",
        content: "Daftar pengguna internal beserta role, unit bisnis, dan status keaktifannya.",
      },
      { property: "og:title", content: "Kelola Pengguna" },
      { property: "og:description", content: "Kelola role dan unit bisnis pengguna internal." },
    ],
  }),
  component: UserManagementPage,
});
