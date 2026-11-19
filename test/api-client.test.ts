import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/lib/http/api-client";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("ApiClient", () => {
  it("rotates one refresh token for concurrent expired requests", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input);
        const token = new Headers(init?.headers).get("Authorization");
        if (path.endsWith("/auth/refresh"))
          return json(200, { accessToken: "fresh" });
        if (token === "Bearer stale") return json(401, {});
        return json(200, { id: "u1", email: "a@example.com" });
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    client.setAccessToken("stale");

    await Promise.all([client.me(), client.me()]);

    expect(
      fetcher.mock.calls.filter(([path]) =>
        String(path).endsWith("/auth/refresh"),
      ),
    ).toHaveLength(1);
    expect(
      fetcher.mock.calls.filter(
        ([, init]) =>
          new Headers(init?.headers).get("Authorization") === "Bearer fresh",
      ),
    ).toHaveLength(2);
  });

  it("does not retry after failed refresh", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) =>
      String(input).endsWith("/auth/refresh") ? json(401, {}) : json(401, {}),
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    client.setAccessToken("stale");

    await expect(client.me()).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("keeps the session when logout fails so the user can retry", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) =>
        json(503, { path: String(input), method: init?.method }),
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    client.setAccessToken("secret");

    await expect(client.logout()).rejects.toMatchObject({ status: 503 });
    await expect(client.me()).rejects.toMatchObject({ status: 503 });
    expect(
      new Headers(fetcher.mock.calls[1]?.[1]?.headers).get("Authorization"),
    ).toBe("Bearer secret");
  });

  it("refreshes an expired access token before logging out", async () => {
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input);
        const token = new Headers(init?.headers).get("Authorization");
        if (path.endsWith("/auth/refresh"))
          return json(200, { accessToken: "fresh" });
        if (path.endsWith("/auth/logout") && token === "Bearer stale")
          return json(401, {});
        if (path.endsWith("/auth/logout") && token === "Bearer fresh")
          return new Response(null, { status: 204 });
        return json(500, {});
      },
    );
    const client = new ApiClient(
      "http://localhost/api/v1",
      fetcher as typeof fetch,
    );
    const onSessionLost = vi.fn();
    client.onSessionLost(onSessionLost);
    client.setAccessToken("stale");

    await client.logout();

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(onSessionLost).toHaveBeenCalledTimes(1);
  });
});
