"use client";

import { useQuery } from "@tanstack/react-query";
import { listFolders } from "../api/folders.api";
import { folderKeys } from "../api/folders.keys";

export function useFolders(userId: string, projectId: string) {
  return useQuery({
    queryKey: folderKeys.list(userId, projectId),
    queryFn: () => listFolders(projectId),
  });
}
