import { z } from "zod";

export const auditEventSchema = z.strictObject({
  id: z.uuid(),
  projectId: z.uuid(),
  actorType: z.enum(["USER", "API_KEY", "SYSTEM"]),
  actorId: z.uuid().nullable(),
  action: z.enum([
    "PROJECT_CREATED",
    "PROJECT_RENAMED",
    "PROJECT_DELETED",
    "API_KEY_ISSUED",
    "API_KEY_REVOKED",
    "FILE_UPLOADED",
    "FILE_TRASHED",
    "FILE_RESTORED",
    "FILE_PURGE_REQUESTED",
    "FILE_PURGED",
    "SHARE_LINK_CREATED",
    "SHARE_LINK_REVOKED",
  ]),
  resourceId: z.uuid().nullable(),
  occurredAt: z.iso.datetime(),
});

export const auditPageSchema = z.strictObject({
  items: z.array(auditEventSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
});

export type AuditEvent = z.infer<typeof auditEventSchema>;
