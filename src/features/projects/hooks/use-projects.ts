"use client";

import { useQuery } from "@tanstack/react-query";
import { listProjects } from "../api/projects.api";
import { projectKeys } from "../api/projects.keys";

export function useProjects(userId: string) {
  return useQuery({
    queryKey: projectKeys.list(userId),
    queryFn: () => listProjects(),
  });
}
