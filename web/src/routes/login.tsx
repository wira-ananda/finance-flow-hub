import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "@/pages/LoginPage";

interface LoginSearch {
  redirect?: string;

  error?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    ...(typeof search.redirect === "string"
      ? {
          redirect: search.redirect,
        }
      : {}),

    ...(typeof search.error === "string"
      ? {
          error: search.error,
        }
      : {}),
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
  const { redirect, error } = Route.useSearch();

  return <LoginPage redirectTo={redirect} errorCode={error} />;
}
