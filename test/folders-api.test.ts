import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/lib/http/api-client";
import {
  createFolder,
  deleteFolder,
  listFolders,
  renameFolder,
} from "../src/features/files/api/folders.api";
import { folderKeys } from "../src/features/files/api/folders.keys";

const projectId = "00000000-0000-4000-8000-000000000001";
const folderId = "00000000-0000-4000-8000-000000000002";
const folder = {
  id: folderId,
  projectId,
  name: "Media",
  createdAt: "2026-11-20T00:00:00.000Z",
  updatedAt: "2026-11-20T00:00:00.000Z",
};

describe("folder API contract", () => {
  it("loads and validates project-scoped folders", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(
          `http://localhost/api/v1/projects/${projectId}/folders`,
        );
        expect(new Headers(init?.headers).get("Authorization")).toBe(
          "Bearer access",
        );
        return Response.json([folder]);
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    client.setAccessToken("access");
    await expect(listFolders(projectId, client)).resolves.toEqual([folder]);
    expect(folderKeys.list("user-a", projectId)).not.toEqual(
      folderKeys.list("user-b", projectId),
    );
  });

  it("sends trimmed names and handles create, rename and delete", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "DELETE")
          return new Response(null, { status: 204 });
        return Response.json(folder);
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    await createFolder(projectId, { name: "  Media  " }, client);
    expect(fetcher.mock.calls[0][0]).toBe(
      `http://localhost/api/v1/projects/${projectId}/folders`,
    );
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual({
      name: "Media",
    });
    await renameFolder(projectId, folderId, { name: "  Media  " }, client);
    expect(fetcher.mock.calls[1][1]?.method).toBe("PATCH");
    await expect(
      deleteFolder(projectId, folderId, client),
    ).resolves.toBeUndefined();
    expect(fetcher.mock.calls[2][1]?.method).toBe("DELETE");
  });

  it("rejects folders from another project and invalid names", async () => {
    const client = new ApiClient(
      "http://localhost/api/v1",
      vi.fn(async () =>
        Response.json({
          ...folder,
          projectId: "00000000-0000-4000-8000-000000000003",
        }),
      ) as typeof fetch,
    );
    await expect(
      createFolder(projectId, { name: "Media" }, client),
    ).rejects.toMatchObject({ status: 502 });
    await expect(
      createFolder(projectId, { name: "../escape" }, client),
    ).rejects.toBeDefined();
  });
});
