export const folderKeys = {
  list: (userId: string, projectId: string) =>
    ["folders", "list", userId, projectId] as const,
};
