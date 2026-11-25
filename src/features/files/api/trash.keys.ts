import type { FileListParams } from "../schemas/files.schemas";

export const trashKeys = {
  project: (userId: string, projectId: string) =>
    ["files", "trash", userId, projectId] as const,
  list: (userId: string, projectId: string, params: FileListParams) =>
    ["files", "trash", userId, projectId, params] as const,
};
