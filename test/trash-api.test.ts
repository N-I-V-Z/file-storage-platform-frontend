import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/lib/http/api-client";
import {
  listTrash,
  moveToTrash,
  purgeTrash,
  restoreTrash,
} from "../src/features/files/api/trash.api";

const projectId = "00000000-0000-4000-8000-000000000001";
const fileId = "00000000-0000-4000-8000-000000000002";
const item = {
  id: fileId,
  projectId,
  folderId: null,
  originalName: "report.pdf",
  contentType: "application/pdf",
  sizeBytes: "9007199254740993",
  status: "trashed",
  createdAt: "2026-11-20T00:00:00.000Z",
  trashedAt: "2026-11-21T00:00:00.000Z",
  purgeAfter: "2026-12-21T00:00:00.000Z",
};

describe("trash API contract", () => {
  it("lists owner trash with bounded filters and rejects foreign files", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        expect(url.pathname).toBe(`/api/v1/projects/${projectId}/trash`);
        expect(url.searchParams.get("page")).toBe("2");
        expect(url.searchParams.get("search")).toBe("a&b");
        expect(new Headers(init?.headers).get("Authorization")).toBe(
          "Bearer access",
        );
        return Response.json({
          success: true,
          data: { items: [item], page: 2, pageSize: 20, total: 21 },
          timestamp: item.trashedAt,
        });
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    client.setAccessToken("access");
    await expect(
      listTrash(projectId, { page: 2, search: "a&b" }, client),
    ).resolves.toMatchObject({ items: [item], total: 21 });
    const invalid = new ApiClient(
      "http://localhost/api/v1",
      vi.fn(async () =>
        Response.json({
          items: [{ ...item, projectId: fileId }],
          page: 1,
          pageSize: 20,
          total: 1,
        }),
      ) as typeof fetch,
    );
    await expect(listTrash(projectId, {}, invalid)).rejects.toMatchObject({
      status: 502,
    });
  });

  it("uses private lifecycle endpoints and accepts empty 204 responses", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        expect(new Headers(init?.headers).get("Authorization")).toBe(
          "Bearer access",
        );
        if (url.pathname.endsWith("/restore"))
          return Response.json({
            success: true,
            data: { id: fileId, status: "ready" },
            timestamp: item.trashedAt,
          });
        return new Response(null, { status: 204 });
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    client.setAccessToken("access");
    await moveToTrash(projectId, fileId, client);
    await expect(restoreTrash(projectId, fileId, client)).resolves.toEqual({
      id: fileId,
      status: "ready",
    });
    await purgeTrash(projectId, fileId, client);
    expect(
      fetcher.mock.calls.map(([path, init]) => [
        new URL(String(path)).pathname,
        init?.method,
      ]),
    ).toEqual([
      [`/api/v1/projects/${projectId}/files/${fileId}`, "DELETE"],
      [`/api/v1/projects/${projectId}/trash/${fileId}/restore`, "POST"],
      [`/api/v1/projects/${projectId}/trash/${fileId}`, "DELETE"],
    ]);
  });
});
