import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/lib/http/api-client";
import {
  canPreview,
  fetchDownload,
  fetchPreview,
} from "../src/features/files/api/download.api";
import type { StoredFile } from "../src/features/files/schemas/files.schemas";

const projectId = "00000000-0000-4000-8000-000000000001";
const file: StoredFile = {
  id: "00000000-0000-4000-8000-000000000002",
  projectId,
  folderId: null,
  originalName: "clip.mp4",
  contentType: "video/mp4",
  sizeBytes: "4",
  sha256: "a".repeat(64),
  status: "ready",
  createdAt: "2026-11-20T00:00:00.000Z",
};
const signal = new AbortController().signal;

describe("private file transport", () => {
  it("sends Bearer auth for binary download and checks the complete response", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(new Headers(init?.headers).get("Authorization")).toBe(
          "Bearer access",
        );
        return new Response("DATA", {
          status: 200,
          headers: { "Content-Type": "video/mp4" },
        });
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    client.setAccessToken("access");
    const result = await fetchDownload(projectId, file, signal, client);
    expect(result.size).toBe(4);
    expect(result.type).toBe("video/mp4");
    expect(fetcher.mock.calls[0][0]).toBe(
      `http://localhost/api/v1/projects/${projectId}/files/${file.id}/download`,
    );
  });

  it("requests authenticated video ranges and rejects an incomplete range", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(new Headers(init?.headers).get("Range")).toBe("bytes=0-3");
        return new Response("DATA", {
          status: 206,
          headers: {
            "Content-Type": "video/mp4",
            "Content-Range": "bytes 0-3/4",
          },
        });
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    const preview = await fetchPreview(projectId, file, signal, client);
    expect(preview.size).toBe(4);
    expect(preview.type).toBe("video/mp4");
    const wrong = new ApiClient(
      "http://localhost/api/v1",
      vi.fn(
        async () =>
          new Response("BAD", {
            status: 206,
            headers: {
              "Content-Type": "video/mp4",
            },
          }),
      ) as typeof fetch,
    );
    await expect(
      fetchPreview(projectId, file, signal, wrong),
    ).rejects.toMatchObject({ status: 502 });
  });

  it("does not preview ZIP or large videos and rejects error JSON as bytes", async () => {
    expect(canPreview({ ...file, contentType: "application/zip" })).toBe(false);
    expect(canPreview({ ...file, sizeBytes: String(65 * 1024 * 1024) })).toBe(
      false,
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      vi.fn(async () =>
        Response.json({ success: false }, { status: 403 }),
      ) as typeof fetch,
    );
    await expect(
      fetchDownload(projectId, file, signal, client),
    ).rejects.toMatchObject({ status: 403 });
  });
});
