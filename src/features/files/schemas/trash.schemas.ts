import { z } from "zod";
import { fileContentTypeSchema } from "./files.schemas";

export const trashItemSchema = z.strictObject({
  id: z.uuid(),
  projectId: z.uuid(),
  folderId: z.uuid().nullable(),
  originalName: z.string().min(1),
  contentType: fileContentTypeSchema,
  sizeBytes: z.string().regex(/^(0|[1-9]\d*)$/),
  status: z.literal("trashed"),
  createdAt: z.iso.datetime(),
  trashedAt: z.iso.datetime(),
  purgeAfter: z.iso.datetime(),
});

export const trashPageSchema = z.strictObject({
  items: z.array(trashItemSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
});

export const restoreResultSchema = z.strictObject({
  id: z.uuid(),
  status: z.literal("ready"),
});

export type TrashItem = z.infer<typeof trashItemSchema>;
