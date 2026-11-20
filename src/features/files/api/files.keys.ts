import type { FileListParams } from "../schemas/files.schemas";

export const fileKeys = {
  all: ["files"] as const,
  list: (userId: string, projectId: string, params: FileListParams) =>
    ["files", "list", userId, projectId, params] as const,
};
