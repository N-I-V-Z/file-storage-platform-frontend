import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/lib/http/api-client";
import { getProjectUsage } from "../src/features/projects/api/projects.api";
import { projectKeys } from "../src/features/projects/api/projects.keys";
import {
  formatBytes,
  usagePercent,
} from "../src/features/projects/usage-format";

const projectId = "00000000-0000-4000-8000-000000000001";
const balances = {
  projectId,
  quotaBytes: "10737418240",
  usedBytes: "5368709120",
  reservedBytes: "1048576",
};

describe("project usage contract", () => {
  it("loads owner usage through the authenticated API client", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe(
          `http://localhost/api/v1/projects/${projectId}/usage`,
        );
        expect(new Headers(init?.headers).get("Authorization")).toBe(
          "Bearer access",
        );
        return Response.json({
          success: true,
          data: balances,
          timestamp: "2026-11-20T00:00:00.000Z",
        });
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    client.setAccessToken("access");
    await expect(getProjectUsage(projectId, client)).resolves.toEqual(balances);
  });

  it("rejects malformed or mismatched balances", async () => {
    for (const invalid of [
      { ...balances, usedBytes: "1.5" },
      { ...balances, usedBytes: "-1" },
      { ...balances, usedBytes: "10737418241" },
      { ...balances, projectId: "00000000-0000-4000-8000-000000000002" },
    ]) {
      const client = new ApiClient(
        "http://localhost/api/v1",
        vi.fn(async () => Response.json(invalid)) as typeof fetch,
      );
      await expect(getProjectUsage(projectId, client)).rejects.toMatchObject({
        status: 502,
      });
    }
  });

  it("separates usage queries by account and project", () => {
    expect(projectKeys.usage("user-a", projectId)).not.toEqual(
      projectKeys.usage("user-a", "00000000-0000-4000-8000-000000000002"),
    );
    expect(projectKeys.usage("user-a", projectId)).not.toEqual(
      projectKeys.usage("user-b", projectId),
    );
  });

  it("formats binary bytes and percentages without Number precision loss", () => {
    expect(formatBytes(BigInt(0))).toBe("0 B");
    expect(formatBytes(BigInt(1536))).toBe("1,5 KiB");
    expect(formatBytes(BigInt("10737418240"))).toBe("10 GiB");
    expect(
      usagePercent(BigInt("9007199254740993"), BigInt("18014398509481986")),
    ).toBe(50);
    expect(usagePercent(BigInt(1), BigInt(0))).toBe(0);
  });
});
