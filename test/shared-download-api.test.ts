import { describe, expect, it, vi } from "vitest";
import {
  inspectSharedFile,
  saveSharedFile,
} from "../src/features/share-links/api/shared-download.api";

const token = `fsps_${"A".repeat(43)}`;

describe("public shared download", () => {
  it("reads file metadata using the secret header without cookies or a token URL", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(null, {
          status: 200,
          headers: {
            "Content-Disposition":
              "attachment; filename*=UTF-8''report%20one.pdf",
            "Content-Length": "5",
            "Content-Type": "application/pdf",
          },
        }),
    );
    await expect(
      inspectSharedFile(token, undefined, fetcher as typeof fetch),
    ).resolves.toEqual({
      name: "report one.pdf",
      size: 5,
      contentType: "application/pdf",
    });
    expect(fetcher).toHaveBeenCalledWith(
      expect.not.stringContaining(token),
      expect.objectContaining({
        method: "HEAD",
        headers: { Authorization: `Share ${token}` },
        credentials: "omit",
        cache: "no-store",
      }),
    );
  });

  it("rejects malformed secrets before making a request", async () => {
    const fetcher = vi.fn();
    await expect(
      inspectSharedFile("bad", undefined, fetcher as typeof fetch),
    ).rejects.toThrow("không hợp lệ");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects a truncated stream instead of saving it", async () => {
    const fetcher = vi.fn(
      async () => new Response(new Uint8Array([1, 2]), { status: 200 }),
    );
    await expect(
      saveSharedFile(
        token,
        { name: "report.pdf", size: 5, contentType: "application/pdf" },
        undefined,
        fetcher as typeof fetch,
      ),
    ).rejects.toThrow("không đầy đủ");
  });
});
