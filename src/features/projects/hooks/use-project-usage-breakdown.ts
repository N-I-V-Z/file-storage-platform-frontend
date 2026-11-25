"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjectUsageBreakdown } from "../api/projects.api";
import { projectKeys } from "../api/projects.keys";

export function useProjectUsageBreakdown(userId: string, projectId: string) {
  return useQuery({
    queryKey: projectKeys.usageBreakdown(userId, projectId),
    queryFn: () => getProjectUsageBreakdown(projectId),
  });
}
