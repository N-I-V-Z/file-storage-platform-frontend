import { ApiClient, apiClient } from "@/src/lib/http/api-client";
import {
  issuedShareLinkSchema,
  shareExpirationSchema,
  shareLinksSchema,
  type ShareExpirationHours,
} from "../schemas/share-links.schemas";

function path(projectId: string, fileId: string) {
  return `/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/share-links`;
}

export function listShareLinks(
  projectId: string,
  fileId: string,
  client: ApiClient = apiClient,
) {
  return client.request(path(projectId, fileId), shareLinksSchema);
}

export function createShareLink(
  projectId: string,
  fileId: string,
  hours: ShareExpirationHours,
  client: ApiClient = apiClient,
  now = new Date(),
) {
  shareExpirationSchema.parse(hours);
  const expiresAt = new Date(now.getTime() + hours * 60 * 60_000).toISOString();
  return client.request(path(projectId, fileId), issuedShareLinkSchema, {
    method: "POST",
    body: JSON.stringify({ expiresAt }),
  });
}

export function revokeShareLink(
  projectId: string,
  fileId: string,
  linkId: string,
  client: ApiClient = apiClient,
) {
  return client.requestNoContent(
    `${path(projectId, fileId)}/${encodeURIComponent(linkId)}`,
    { method: "DELETE" },
  );
}
