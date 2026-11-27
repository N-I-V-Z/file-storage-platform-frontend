import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/lib/http/api-client";
import {
  getAdminOverview,
  listAdminAuditEvents,
  listAdminProjects,
} from "../src/features/admin/api/admin.api";

const envelope = (data: unknown) =>
  new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: "2026-11-26T00:00:00.000Z",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );

describe("admin API contract", () => {
  it("reads byte totals as decimal strings without losing precision", async () => {
    const data = {
      userCount: 2,
      projectCount: 1,
      fileCount: 3,
      quotaBytes: "9007199254740993",
      usedBytes: "2048",
      reservedBytes: "0",
    };
    const client = new ApiClient(
      "/api/v1",
      vi.fn(async () => envelope(data)) as typeof fetch,
    );
    await expect(getAdminOverview(client)).resolves.toEqual(data);
  });

  it("rejects malformed pagination and byte values", async () => {
    const client = new ApiClient(
      "/api/v1",
      vi.fn(async () =>
        envelope({
          items: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              ownerId: "22222222-2222-4222-8222-222222222222",
              name: "Project",
              quotaBytes: "-1",
              usedBytes: "0",
              reservedBytes: "0",
              createdAt: "2026-11-26T00:00:00.000Z",
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
        }),
      ) as typeof fetch,
    );
    await expect(listAdminProjects(1, client)).rejects.toMatchObject({
      status: 502,
    });
  });

  it("keeps the audit page bound to the requested page", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain("/admin/audit-events?page=1&pageSize=20");
      return envelope({ items: [], total: 0, page: 2, pageSize: 20 });
    });
    const client = new ApiClient("/api/v1", fetcher as typeof fetch);
    await expect(listAdminAuditEvents(1, client)).rejects.toMatchObject({
      status: 502,
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
