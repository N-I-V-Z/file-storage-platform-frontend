import { ApiClient, ApiError, apiClient } from "@/src/lib/http/api-client";
import type { StoredFile } from "../schemas/files.schemas";

const MAX_PREVIEW_BYTES = 64 * 1024 * 1024;
const VIDEO_CHUNK_BYTES = 8 * 1024 * 1024;
const PREVIEW_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "video/mp4",
]);

export function canPreview(file: StoredFile) {
  return (
    PREVIEW_TYPES.has(file.contentType) &&
    BigInt(file.sizeBytes) <= BigInt(MAX_PREVIEW_BYTES)
  );
}

function path(projectId: string, fileId: string) {
  return `/projects/${projectId}/files/${fileId}/download`;
}

function assertResponse(
  response: Response,
  file: StoredFile,
  expectedStatus: 200 | 206,
) {
  if (
    response.status !== expectedStatus ||
    response.headers.get("Content-Type")?.split(";")[0].trim() !==
      file.contentType
  ) {
    throw new ApiError(502, "Máy chủ trả tệp không hợp lệ.");
  }
}

export async function fetchDownload(
  projectId: string,
  file: StoredFile,
  signal: AbortSignal,
  client: ApiClient = apiClient,
) {
  if (file.projectId !== projectId)
    throw new ApiError(502, "Tệp không thuộc project đang chọn.");
  const response = await client.requestBinary(path(projectId, file.id), {
    signal,
  });
  assertResponse(response, file, 200);
  const blob = await response.blob();
  if (BigInt(blob.size) !== BigInt(file.sizeBytes))
    throw new ApiError(502, "Tệp tải về không đầy đủ.");
  return blob;
}

export async function fetchPreview(
  projectId: string,
  file: StoredFile,
  signal: AbortSignal,
  client: ApiClient = apiClient,
) {
  if (!canPreview(file))
    throw new Error("Tệp này chưa hỗ trợ xem trước hoặc vượt 64 MiB.");
  if (file.contentType !== "video/mp4")
    return fetchDownload(projectId, file, signal, client);
  if (file.projectId !== projectId)
    throw new ApiError(502, "Tệp không thuộc project đang chọn.");
  const size = Number(file.sizeBytes);
  const chunks: BlobPart[] = [];
  for (let start = 0; start < size; start += VIDEO_CHUNK_BYTES) {
    const end = Math.min(size - 1, start + VIDEO_CHUNK_BYTES - 1);
    const response = await client.requestBinary(path(projectId, file.id), {
      headers: { Range: `bytes=${start}-${end}` },
      signal,
    });
    assertResponse(response, file, 206);
    // Content-Range is not exposed by the backend's cross-origin CORS policy.
    const chunk = await response.arrayBuffer();
    if (chunk.byteLength !== end - start + 1)
      throw new ApiError(502, "Dải byte tải về không đầy đủ.");
    chunks.push(chunk);
  }
  return new Blob(chunks, { type: file.contentType });
}
