import { z } from "zod";

export const shareLinkSchema = z.strictObject({
  id: z.uuid(),
  fileId: z.uuid(),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  revokedAt: z.iso.datetime().nullable(),
});

export const issuedShareLinkSchema = shareLinkSchema.extend({
  token: z.string().regex(/^fsps_[A-Za-z0-9_-]{43}$/),
});

export const shareLinksSchema = z.array(shareLinkSchema);
export const shareExpirationSchema = z.union([
  z.literal(1),
  z.literal(24),
  z.literal(168),
]);
export type ShareLink = z.infer<typeof shareLinkSchema>;
export type IssuedShareLink = z.infer<typeof issuedShareLinkSchema>;
export type ShareExpirationHours = z.infer<typeof shareExpirationSchema>;
