import { z } from "zod";
import { auditEventSchema } from "@/src/features/audit/schemas/audit.schemas";

const bytes = z.string().regex(/^(0|[1-9]\d*)$/);

export const adminOverviewSchema = z.strictObject({
  userCount: z.number().int().nonnegative(),
  projectCount: z.number().int().nonnegative(),
  fileCount: z.number().int().nonnegative(),
  quotaBytes: bytes,
  usedBytes: bytes,
  reservedBytes: bytes,
});

export const adminProjectSchema = z.strictObject({
  id: z.uuid(),
  ownerId: z.uuid(),
  name: z.string(),
  quotaBytes: bytes,
  usedBytes: bytes,
  reservedBytes: bytes,
  createdAt: z.iso.datetime(),
});

const pageFields = {
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
};

export const adminProjectsPageSchema = z.strictObject({
  items: z.array(adminProjectSchema),
  ...pageFields,
});

export const adminAuditEventSchema = auditEventSchema.extend({
  purgeAfter: z.iso.datetime().nullable(),
});

export const adminAuditPageSchema = z.strictObject({
  items: z.array(adminAuditEventSchema),
  ...pageFields,
});
