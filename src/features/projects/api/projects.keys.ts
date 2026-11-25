export const projectKeys = {
  all: ["projects"] as const,
  list: (userId: string) => ["projects", "list", userId] as const,
  usage: (userId: string, projectId: string) =>
    ["projects", "usage", userId, projectId] as const,
  usageBreakdown: (userId: string, projectId: string) =>
    ["projects", "usage-breakdown", userId, projectId] as const,
};
