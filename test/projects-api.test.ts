import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/lib/http/api-client";
import {
  createProject,
  listProjects,
} from "../src/features/projects/api/projects.api";

const project = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Media",
  createdAt: "2026-11-19T00:00:00.000Z",
  updatedAt: "2026-11-19T00:00:00.000Z",
};

describe("projects API", () => {
  it("loads owned projects with a bearer token", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe("http://localhost/api/v1/projects");
        expect(new Headers(init?.headers).get("Authorization")).toBe(
          "Bearer access",
        );
        return Response.json([project]);
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    client.setAccessToken("access");

    await expect(listProjects(client)).resolves.toEqual([project]);
  });

  it("rejects malformed project data", async () => {
    const fetcher = vi.fn(async () =>
      Response.json([{ id: "bad", name: "Media" }]),
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    await expect(listProjects(client)).rejects.toMatchObject({ status: 502 });
  });

  it("sends a trimmed project name", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual({ name: "Media" });
        return Response.json(project, { status: 201 });
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    await expect(createProject({ name: "  Media  " }, client)).resolves.toEqual(
      project,
    );
  });
});
