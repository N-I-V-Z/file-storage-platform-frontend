import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/lib/http/api-client";
import { listAuditEvents } from "../src/features/audit/api/audit.api";
import { auditKeys } from "../src/features/audit/api/audit.keys";

const projectId = "00000000-0000-4000-8000-000000000001";
const event = {
  id: "00000000-0000-4000-8000-000000000002",
  projectId,
  actorType: "API_KEY",
  actorId: "00000000-0000-4000-8000-000000000003",
  action: "FILE_UPLOADED",
  resourceId: "00000000-0000-4000-8000-000000000004",
  occurredAt: "2026-11-26T10:00:00.000Z",
};

describe("audit API", () => {
  it("requests a private page with the current bearer token", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(
          `http://localhost/api/v1/projects/${projectId}/audit-events?page=2&pageSize=10`,
        );
        expect(new Headers(init?.headers).get("Authorization")).toBe(
          "Bearer access",
        );
        return Response.json({
          success: true,
          data: { items: [event], total: 11, page: 2, pageSize: 10 },
          timestamp: "2026-11-26T10:00:00.000Z",
        });
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    client.setAccessToken("access");
    await expect(
      listAuditEvents(projectId, 2, 10, client),
    ).resolves.toMatchObject({
      items: [event],
      total: 11,
    });
  });

  it("rejects foreign, malformed, or unexpected response fields", async () => {
    for (const data of [
      {
        items: [
          { ...event, projectId: "00000000-0000-4000-8000-000000000099" },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      },
      {
        items: [{ ...event, token: "secret" }],
        total: 1,
        page: 1,
        pageSize: 10,
      },
      {
        items: [{ ...event, actorType: "OWNER" }],
        total: 1,
        page: 1,
        pageSize: 10,
      },
      { items: [event], total: 1, page: 2, pageSize: 10 },
    ]) {
      const client = new ApiClient(
        "http://localhost/api/v1",
        vi.fn(async () => Response.json(data)) as typeof fetch,
      );
      await expect(
        listAuditEvents(projectId, 1, 10, client),
      ).rejects.toMatchObject({ status: 502 });
    }
  });

  it("isolates pages by account and project", () => {
    expect(auditKeys.page("user-a", projectId, 1)).not.toEqual(
      auditKeys.page("user-b", projectId, 1),
    );
    expect(auditKeys.page("user-a", projectId, 1)).not.toEqual(
      auditKeys.page("user-a", projectId, 2),
    );
    expect(auditKeys.page("user-a", projectId, 1)).not.toEqual(
      auditKeys.page("user-a", "00000000-0000-4000-8000-000000000099", 1),
    );
  });
});
