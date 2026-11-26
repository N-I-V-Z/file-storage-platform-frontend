export const auditKeys = {
  project: (userId: string, projectId: string) =>
    ["audit", userId, projectId] as const,
  page: (userId: string, projectId: string, page: number) =>
    ["audit", userId, projectId, page] as const,
};
