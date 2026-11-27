import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/lib/http/api-client";
import {
  createShareLink,
  listShareLinks,
  revokeShareLink,
} from "../src/features/share-links/api/share-links.api";

const projectId = "00000000-0000-4000-8000-000000000001";
const fileId = "00000000-0000-4000-8000-000000000002";
const linkId = "00000000-0000-4000-8000-000000000003";
const token = `fsps_${"A".repeat(43)}`;
const metadata = {
  id: linkId,
  fileId,
  createdAt: "2026-11-27T00:00:00.000Z",
  expiresAt: "2026-11-28T00:00:00.000Z",
  revokedAt: null,
};

describe("share link API", () => {
  it("creates a link with a one-time secret and explicit expiry", async () => {
    const fetcher = vi.fn(async () =>
      Response.json(
        {
          success: true,
          data: { ...metadata, token },
          timestamp: "2026-11-27T00:00:00.000Z",
        },
        { status: 201 },
      ),
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    await expect(
      createShareLink(
        projectId,
        fileId,
        24,
        client,
        new Date("2026-11-27T00:00:00.000Z"),
      ),
    ).resolves.toMatchObject({ token });
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining(
        `/projects/${projectId}/files/${fileId}/share-links`,
      ),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ expiresAt: "2026-11-28T00:00:00.000Z" }),
      }),
    );
  });

  it("lists only metadata and rejects a leaked token", async () => {
    const client = new ApiClient(
      "http://localhost/api/v1",
      vi.fn(async () => Response.json([metadata])) as typeof fetch,
    );
    await expect(listShareLinks(projectId, fileId, client)).resolves.toEqual([
      metadata,
    ]);
    const leaked = new ApiClient(
      "http://localhost/api/v1",
      vi.fn(async () =>
        Response.json([{ ...metadata, token }]),
      ) as typeof fetch,
    );
    await expect(
      listShareLinks(projectId, fileId, leaked),
    ).rejects.toMatchObject({ status: 502 });
  });

  it("revokes by link id", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    await revokeShareLink(projectId, fileId, linkId, client);
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`/${linkId}$`)),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
