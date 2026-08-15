export const financeQueryKeys = {
  session: {
    current: ["finance", "session", "current"] as const,
  },

  users: {
    all: ["finance", "users"] as const,
  },

  businessUnits: {
    all: ["finance", "business-units"] as const,
  },

  requests: {
    root: ["finance", "requests"] as const,

    list: (actorId: string) => ["finance", "requests", "list", actorId] as const,

    detail: (actorId: string, requestId: string) =>
      ["finance", "requests", "detail", actorId, requestId] as const,
  },
} as const;
