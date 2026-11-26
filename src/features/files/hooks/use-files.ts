"use client";

import { useQuery } from "@tanstack/react-query";
import { listFiles } from "../api/files.api";
import { fileKeys } from "../api/files.keys";
import type { FileListParams } from "../schemas/files.schemas";

export function useFiles(
  userId: string,
  projectId: string,
  params: FileListParams,
) {
  return useQuery({
    queryKey: fileKeys.list(userId, projectId, params),
    queryFn: () => listFiles(projectId, params),
  });
}
