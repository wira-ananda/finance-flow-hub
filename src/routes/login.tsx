import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/pages/LoginPage";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),

  head: () => ({
    meta: [
      {
        title: "Masuk | Finance Request Management System",
      },
      {
        name: "description",
        content: "Masuk ke Finance Request Management System.",
      },
    ],
  }),

  component: LoginRoute,
});

function LoginRoute() {
  const { redirect } = Route.useSearch();

  return <LoginPage redirectTo={redirect} />;
}
