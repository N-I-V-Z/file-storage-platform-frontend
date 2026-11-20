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

type WritableFile = {
  write(chunk: Uint8Array): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
};
type FilePickerWindow = Window & {
  showSaveFilePicker?: (options: { suggestedName: string }) => Promise<{
    createWritable(): Promise<WritableFile>;
  }>;
};

export async function saveDownload(
  projectId: string,
  file: StoredFile,
  signal: AbortSignal,
  client: ApiClient = apiClient,
) {
  if (file.projectId !== projectId)
    throw new ApiError(502, "Tệp không thuộc project đang chọn.");
  const picker = (window as FilePickerWindow).showSaveFilePicker;
  if (picker) {
    // The picker must open in the user's click gesture, before network awaits.
    const handle = await picker.call(window, {
      suggestedName: file.originalName,
    });
    const writer = await handle.createWritable();
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    try {
      const response = await client.requestBinary(path(projectId, file.id), {
        signal,
      });
      assertResponse(response, file, 200);
      if (!response.body)
        throw new ApiError(502, "Máy chủ không trả luồng tệp.");
      reader = response.body.getReader();
      let received = BigInt(0);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += BigInt(value.byteLength);
        if (received > BigInt(file.sizeBytes))
          throw new ApiError(502, "Tệp tải về không hợp lệ.");
        await writer.write(value);
      }
      if (received !== BigInt(file.sizeBytes))
        throw new ApiError(502, "Tệp tải về không đầy đủ.");
      await writer.close();
      return;
    } catch (error) {
      await reader?.cancel().catch(() => undefined);
      await writer.abort().catch(() => undefined);
      throw error;
    }
  }
  if (BigInt(file.sizeBytes) > BigInt(MAX_PREVIEW_BYTES)) {
    throw new Error(
      "Trình duyệt này cần hỗ trợ lưu tệp theo luồng để tải tệp trên 64 MiB.",
    );
  }
  const blob = await fetchDownload(projectId, file, signal, client);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.originalName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
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
