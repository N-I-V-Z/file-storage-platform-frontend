import { z } from "zod";

export const fileContentTypeSchema = z.enum([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "application/zip",
]);

export const fileSortSchema = z.enum([
  "newest",
  "oldest",
  "name-asc",
  "name-desc",
  "size-asc",
  "size-desc",
]);

export const fileSchema = z.strictObject({
  id: z.uuid(),
  projectId: z.uuid(),
  folderId: z.uuid().nullable(),
  originalName: z.string().min(1),
  contentType: fileContentTypeSchema,
  sizeBytes: z.string().regex(/^(0|[1-9]\d*)$/),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  status: z.literal("ready"),
  createdAt: z.iso.datetime(),
});

export const filePageSchema = z.strictObject({
  items: z.array(fileSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
});

export const fileListParamsSchema = z.object({
  page: z.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().max(120).default(""),
  contentType: fileContentTypeSchema.optional(),
  sort: fileSortSchema.default("newest"),
  folderId: z.union([z.uuid(), z.literal("root")]).optional(),
});

export const explorerFiltersSchema = z.object({
  search: z.string().max(120, "Từ khóa tối đa 120 ký tự."),
  contentType: z.union([fileContentTypeSchema, z.literal("all")]),
  sort: fileSortSchema,
});

export type StoredFile = z.infer<typeof fileSchema>;
export type FilePage = z.infer<typeof filePageSchema>;
export type FileListParams = z.output<typeof fileListParamsSchema>;
export type FileListInput = z.input<typeof fileListParamsSchema>;
export type ExplorerFilters = z.infer<typeof explorerFiltersSchema>;
