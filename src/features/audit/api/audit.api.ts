import { ApiClient, ApiError, apiClient } from "@/src/lib/http/api-client";
import { auditPageSchema } from "../schemas/audit.schemas";

export async function listAuditEvents(
  projectId: string,
  page: number,
  pageSize = 10,
  client: ApiClient = apiClient,
) {
  const result = await client.request(
    `/projects/${projectId}/audit-events?page=${page}&pageSize=${pageSize}`,
    auditPageSchema,
  );
  if (
    result.page !== page ||
    result.pageSize !== pageSize ||
    result.items.some((event) => event.projectId !== projectId)
  ) {
    throw new ApiError(502, "Máy chủ trả dữ liệu không hợp lệ.");
  }
  return result;
}
