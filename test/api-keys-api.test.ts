import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/lib/http/api-client";
import {
  issueApiKey,
  listApiKeys,
  revokeApiKey,
} from "../src/features/api-keys/api/api-keys.api";

const projectId = "00000000-0000-4000-8000-000000000001";
const keyId = "00000000-0000-4000-8000-000000000002";
const metadata = {
  id: keyId,
  projectId,
  name: "Reader",
  scopes: ["files:read"],
  expiresAt: "2027-02-17T00:00:00.000Z",
  revokedAt: null,
  lastUsedAt: null,
  createdAt: "2026-11-19T00:00:00.000Z",
};
const token = `fsp_${keyId}_${"A".repeat(43)}`;

describe("API key contract", () => {
  it("loads metadata without a secret", async () => {
    const client = new ApiClient(
      "http://localhost/api/v1",
      vi.fn(async () => Response.json([metadata])) as typeof fetch,
    );
    await expect(listApiKeys(projectId, client)).resolves.toEqual([metadata]);
  });

  it("rejects any secret in a list response", async () => {
    const client = new ApiClient(
      "http://localhost/api/v1",
      vi.fn(async () =>
        Response.json([{ ...metadata, token }]),
      ) as typeof fetch,
    );
    await expect(listApiKeys(projectId, client)).rejects.toMatchObject({
      status: 502,
    });
  });

  it("issues a key with explicit scope and expiry", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input).endsWith(`/projects/${projectId}/api-keys`)).toBe(
          true,
        );
        expect(JSON.parse(String(init?.body))).toEqual({
          name: "Reader",
          scopes: ["files:read"],
          expiresAt: "2027-02-17T00:00:00.000Z",
        });
        return Response.json({ ...metadata, token }, { status: 201 });
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    await expect(
      issueApiKey(
        projectId,
        { name: " Reader ", scopes: ["files:read"], expiration: "90" },
        client,
        new Date("2026-11-19T00:00:00.000Z"),
      ),
    ).resolves.toMatchObject({ token });
  });

  it("revokes with a 204 response", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(
          String(input).endsWith(`/projects/${projectId}/api-keys/${keyId}`),
        ).toBe(true);
        expect(init?.method).toBe("DELETE");
        return new Response(null, { status: 204 });
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    await expect(
      revokeApiKey(projectId, keyId, client),
    ).resolves.toBeUndefined();
  });
});
