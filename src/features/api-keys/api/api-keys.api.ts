import { ApiClient, apiClient } from "@/src/lib/http/api-client";
import {
  apiKeysSchema,
  createApiKeyFormSchema,
  issuedApiKeySchema,
  type CreateApiKeyValues,
} from "../schemas/api-keys.schemas";

function keyPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/api-keys`;
}

export function listApiKeys(projectId: string, client: ApiClient = apiClient) {
  return client.request(keyPath(projectId), apiKeysSchema);
}

export function issueApiKey(
  projectId: string,
  values: CreateApiKeyValues,
  client: ApiClient = apiClient,
  now = new Date(),
) {
  const input = createApiKeyFormSchema.parse(values);
  const expiresAt =
    input.expiration === "never"
      ? undefined
      : new Date(
          now.getTime() + Number(input.expiration) * 24 * 60 * 60 * 1000,
        ).toISOString();
  return client.request(keyPath(projectId), issuedApiKeySchema, {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      scopes: input.scopes,
      ...(expiresAt ? { expiresAt } : {}),
    }),
  });
}

export function revokeApiKey(
  projectId: string,
  keyId: string,
  client: ApiClient = apiClient,
) {
  return client.requestNoContent(
    `${keyPath(projectId)}/${encodeURIComponent(keyId)}`,
    { method: "DELETE" },
  );
}
