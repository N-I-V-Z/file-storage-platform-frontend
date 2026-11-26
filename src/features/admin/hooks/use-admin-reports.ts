"use client";

import { useQuery } from "@tanstack/react-query";
import { adminKeys } from "../api/admin.keys";
import {
  getAdminOverview,
  listAdminAuditEvents,
  listAdminProjects,
} from "../api/admin.api";

export function useAdminOverview(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.overview(userId),
    queryFn: () => getAdminOverview(),
    enabled,
  });
}

export function useAdminProjects(
  userId: string,
  page: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: adminKeys.projects(userId, page),
    queryFn: () => listAdminProjects(page),
    enabled,
  });
}

export function useAdminAuditEvents(
  userId: string,
  page: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: adminKeys.audit(userId, page),
    queryFn: () => listAdminAuditEvents(page),
    enabled,
  });
}
