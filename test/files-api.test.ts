import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/lib/http/api-client";
import { listFiles } from "../src/features/files/api/files.api";
import { fileKeys } from "../src/features/files/api/files.keys";

const projectId = "00000000-0000-4000-8000-000000000001";
const file = {
  id: "00000000-0000-4000-8000-000000000002",
  projectId,
  folderId: null,
  originalName: "report.pdf",
  contentType: "application/pdf",
  sizeBytes: "9007199254740993",
  sha256: "a".repeat(64),
  status: "ready",
  createdAt: "2026-11-20T00:00:00.000Z",
};

describe("file listing contract", () => {
  it("requests a bounded owner file page with encoded filters", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        expect(url.pathname).toBe(`/api/v1/projects/${projectId}/files`);
        expect(url.searchParams.get("page")).toBe("2");
        expect(url.searchParams.get("pageSize")).toBe("20");
        expect(url.searchParams.get("search")).toBe("a&b");
        expect(url.searchParams.get("sort")).toBe("size-desc");
        expect(new Headers(init?.headers).get("Authorization")).toBe(
          "Bearer access",
        );
        return Response.json({
          success: true,
          data: { items: [file], page: 2, pageSize: 20, total: 21 },
          timestamp: "2026-11-20T00:00:00.000Z",
        });
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    client.setAccessToken("access");
    await expect(
      listFiles(
        projectId,
        { page: 2, search: "a&b", sort: "size-desc" },
        client,
      ),
    ).resolves.toMatchObject({ items: [file], total: 21 });
  });

  it("rejects malformed balances or a file from another project", async () => {
    for (const invalid of [
      { ...file, sizeBytes: "-1" },
      { ...file, sizeBytes: "1.5" },
      { ...file, projectId: "00000000-0000-4000-8000-000000000003" },
      { ...file, status: "uploading" },
    ]) {
      const client = new ApiClient(
        "http://localhost/api/v1",
        vi.fn(async () =>
          Response.json({ items: [invalid], page: 1, pageSize: 20, total: 1 }),
        ) as typeof fetch,
      );
      await expect(listFiles(projectId, {}, client)).rejects.toMatchObject({
        status: 502,
      });
    }
  });

  it("separates pages and filters by account and project", () => {
    const base = { page: 1, pageSize: 20, search: "", sort: "newest" as const };
    expect(fileKeys.list("a", projectId, base)).not.toEqual(
      fileKeys.list("b", projectId, base),
    );
    expect(fileKeys.list("a", projectId, base)).not.toEqual(
      fileKeys.list("a", "00000000-0000-4000-8000-000000000003", base),
    );
    expect(fileKeys.list("a", projectId, base)).not.toEqual(
      fileKeys.list("a", projectId, { ...base, page: 2 }),
    );
  });
});
