export const shareLinkKeys = {
  file: (userId: string, projectId: string, fileId: string) =>
    ["share-links", userId, projectId, fileId] as const,
};
