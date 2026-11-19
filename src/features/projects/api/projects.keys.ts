export const projectKeys = {
  all: ["projects"] as const,
  list: (userId: string) => ["projects", "list", userId] as const,
};
