import { z } from "zod";

export const apiKeyScopeSchema = z.enum([
  "projects:read",
  "files:read",
  "files:write",
]);

export const apiKeySchema = z.strictObject({
  id: z.uuid(),
  projectId: z.uuid(),
  name: z.string().min(1),
  scopes: z.array(apiKeyScopeSchema).min(1),
  expiresAt: z.iso.datetime().nullable(),
  revokedAt: z.iso.datetime().nullable(),
  lastUsedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const apiKeysSchema = z.array(apiKeySchema);

export const issuedApiKeySchema = z.strictObject({
  ...apiKeySchema.shape,
  token: z.string().regex(/^fsp_[0-9a-f-]{36}_[A-Za-z0-9_-]{43}$/),
});

export const createApiKeyFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nhập tên API key.")
    .max(100, "Tên API key tối đa 100 ký tự."),
  scopes: z.array(apiKeyScopeSchema).min(1, "Chọn ít nhất một quyền."),
  expiration: z.enum(["30", "90", "365", "never"]),
});

export type ApiKey = z.infer<typeof apiKeySchema>;
export type IssuedApiKey = z.infer<typeof issuedApiKeySchema>;
export type CreateApiKeyValues = z.infer<typeof createApiKeyFormSchema>;
export type ApiKeyScope = z.infer<typeof apiKeyScopeSchema>;
