export const adminKeys = {
  overview: (userId: string) => ["admin", userId, "overview"] as const,
  projects: (userId: string, page: number) =>
    ["admin", userId, "projects", page] as const,
  audit: (userId: string, page: number) =>
    ["admin", userId, "audit", page] as const,
};
