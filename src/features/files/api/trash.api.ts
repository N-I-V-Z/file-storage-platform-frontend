import { ApiClient, ApiError, apiClient } from "@/src/lib/http/api-client";
import {
  fileListParamsSchema,
  type FileListInput,
} from "../schemas/files.schemas";
import { restoreResultSchema, trashPageSchema } from "../schemas/trash.schemas";

export async function listTrash(
  projectId: string,
  options: FileListInput = {},
  client: ApiClient = apiClient,
) {
  const params = fileListParamsSchema.parse(options);
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    sort: params.sort,
  });
  if (params.search) search.set("search", params.search);
  if (params.contentType) search.set("contentType", params.contentType);
  if (params.folderId) search.set("folderId", params.folderId);
  const page = await client.request(
    `/projects/${projectId}/trash?${search}`,
    trashPageSchema,
  );
  if (page.items.some((file) => file.projectId !== projectId))
    throw new ApiError(502, "Máy chủ trả dữ liệu không hợp lệ.");
  return page;
}

export function moveToTrash(
  projectId: string,
  fileId: string,
  client: ApiClient = apiClient,
): Promise<void> {
  return client.requestNoContent(`/projects/${projectId}/files/${fileId}`, {
    method: "DELETE",
  });
}

export function restoreTrash(
  projectId: string,
  fileId: string,
  client: ApiClient = apiClient,
) {
  return client.request(
    `/projects/${projectId}/trash/${fileId}/restore`,
    restoreResultSchema,
    { method: "POST" },
  );
}

export function purgeTrash(
  projectId: string,
  fileId: string,
  client: ApiClient = apiClient,
): Promise<void> {
  return client.requestNoContent(`/projects/${projectId}/trash/${fileId}`, {
    method: "DELETE",
  });
}
