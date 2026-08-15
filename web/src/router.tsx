import { createRouter } from "@tanstack/react-router";

import { createFinanceQueryClient } from "@/lib/api/query-client";

import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = createFinanceQueryClient();

  const router = createRouter({
    routeTree,

    context: {
      queryClient,
    },

    scrollRestoration: true,

    defaultPreloadStaleTime: 0,
  });

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
