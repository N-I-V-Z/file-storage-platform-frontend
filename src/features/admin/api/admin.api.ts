import { ApiClient, ApiError, apiClient } from "@/src/lib/http/api-client";
import {
  adminAuditPageSchema,
  adminOverviewSchema,
  adminProjectsPageSchema,
} from "../schemas/admin.schemas";

export function getAdminOverview(client: ApiClient = apiClient) {
  return client.request("/admin/overview", adminOverviewSchema);
}

export async function listAdminProjects(
  page: number,
  client: ApiClient = apiClient,
) {
  const result = await client.request(
    `/admin/projects?page=${page}&pageSize=20`,
    adminProjectsPageSchema,
  );
  if (result.page !== page || result.pageSize !== 20)
    throw new ApiError(502, "Máy chủ trả dữ liệu không hợp lệ.");
  return result;
}

export async function listAdminAuditEvents(
  page: number,
  client: ApiClient = apiClient,
) {
  const result = await client.request(
    `/admin/audit-events?page=${page}&pageSize=20`,
    adminAuditPageSchema,
  );
  if (result.page !== page || result.pageSize !== 20)
    throw new ApiError(502, "Máy chủ trả dữ liệu không hợp lệ.");
  return result;
}
