import { ApiClient, ApiError, apiClient } from "@/src/lib/http/api-client";
import { z } from "zod";
import { fileContentTypeSchema } from "../schemas/files.schemas";

const uploadedFileSchema = z.strictObject({
  id: z.uuid(),
  projectId: z.uuid(),
  folderId: z.uuid().nullable(),
  originalName: z.string().min(1),
  contentType: fileContentTypeSchema,
  sizeBytes: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  status: z.literal("ready"),
  createdAt: z.iso.datetime(),
});

const MAX_UPLOAD_BYTES = 512 * 1024 * 1024;
const ALLOWED_TYPES = new Set(fileContentTypeSchema.options);

export function validateLocalFile(file: File): string | null {
  if (!file.size) return "Tệp trống không được tải lên.";
  if (file.size > MAX_UPLOAD_BYTES) return "Tệp vượt quá 512 MiB.";
  if (!ALLOWED_TYPES.has(file.type as z.infer<typeof fileContentTypeSchema>))
    return "Loại tệp chưa được hỗ trợ.";
  if (
    !file.name ||
    new TextEncoder().encode(file.name).length > 255 ||
    /[\\/\x00-\x1f\x7f]/.test(file.name)
  )
    return "Tên tệp không hợp lệ.";
  return null;
}

export async function uploadFile(
  projectId: string,
  file: File,
  folderId: string | undefined,
  signal: AbortSignal,
  onProgress: (loaded: number, total: number) => void,
  client: ApiClient = apiClient,
) {
  const error = validateLocalFile(file);
  if (error) throw new Error(error);
  const body = new FormData();
  body.append("file", file);
  const result = await client.upload(
    `/projects/${projectId}/files`,
    body,
    uploadedFileSchema,
    {
      headers:
        folderId && folderId !== "root" ? { "X-Folder-Id": folderId } : {},
      signal,
      onProgress,
    },
  );
  if (
    result.projectId !== projectId ||
    result.folderId !== (folderId && folderId !== "root" ? folderId : null)
  ) {
    throw new ApiError(502, "Máy chủ trả dữ liệu không hợp lệ.");
  }
  return result;
}
