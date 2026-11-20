"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjectUsage } from "../api/projects.api";
import { projectKeys } from "../api/projects.keys";

export function useProjectUsage(userId: string, projectId: string) {
  return useQuery({
    queryKey: projectKeys.usage(userId, projectId),
    queryFn: () => getProjectUsage(projectId),
  });
}
