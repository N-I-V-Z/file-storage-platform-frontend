"use client";

import { useQuery } from "@tanstack/react-query";
import { listAuditEvents } from "../api/audit.api";
import { auditKeys } from "../api/audit.keys";

export function useAuditEvents(
  userId: string,
  projectId: string,
  page: number,
) {
  return useQuery({
    queryKey: auditKeys.page(userId, projectId, page),
    queryFn: () => listAuditEvents(projectId, page),
  });
}
