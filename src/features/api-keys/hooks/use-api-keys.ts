"use client";

import { useQuery } from "@tanstack/react-query";
import { listApiKeys } from "../api/api-keys.api";
import { apiKeyKeys } from "../api/api-keys.keys";

export function useApiKeys(projectId: string) {
  return useQuery({
    queryKey: apiKeyKeys.list(projectId),
    queryFn: () => listApiKeys(projectId),
  });
}
