import { ApiClient, ApiError, apiClient } from "@/src/lib/http/api-client";
import {
  fileListParamsSchema,
  filePageSchema,
  type FileListInput,
} from "../schemas/files.schemas";

export async function listFiles(
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
    `/projects/${projectId}/files?${search}`,
    filePageSchema,
  );
  if (page.items.some((file) => file.projectId !== projectId)) {
    throw new ApiError(502, "Máy chủ trả dữ liệu không hợp lệ.");
  }
  return page;
}
