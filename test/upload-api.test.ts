import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/lib/http/api-client";
import {
  uploadFile,
  validateLocalFile,
} from "../src/features/files/api/upload.api";

const projectId = "00000000-0000-4000-8000-000000000001";
const folderId = "00000000-0000-4000-8000-000000000002";
const file = new File(["%PDF-1.7"], "note.pdf", { type: "application/pdf" });
const uploaded = {
  id: "00000000-0000-4000-8000-000000000003",
  projectId,
  folderId,
  originalName: "note.pdf",
  contentType: "application/pdf",
  sizeBytes: file.size,
  sha256: "a".repeat(64),
  status: "ready",
  createdAt: "2026-11-20T00:00:00.000Z",
};

describe("upload API", () => {
  it("rejects empty, unsupported and unsafe files before sending", () => {
    expect(
      validateLocalFile(new File([], "empty.pdf", { type: "application/pdf" })),
    ).toMatch(/trống/);
    expect(
      validateLocalFile(new File(["x"], "x.txt", { type: "text/plain" })),
    ).toMatch(/hỗ trợ/);
    expect(
      validateLocalFile(
        new File(["x"], "bad/name.pdf", { type: "application/pdf" }),
      ),
    ).toMatch(/Tên tệp/);
  });

  it("posts one multipart file with folder header and accepts READY metadata", async () => {
    const client = new ApiClient(
      "http://localhost/api/v1",
      vi.fn() as typeof fetch,
    );
    const transport = vi.spyOn(client, "upload").mockResolvedValue(uploaded);
    const signal = new AbortController().signal;
    await expect(
      uploadFile(projectId, file, folderId, signal, vi.fn(), client),
    ).resolves.toEqual(uploaded);
    expect(transport).toHaveBeenCalledWith(
      `/projects/${projectId}/files`,
      expect.any(FormData),
      expect.anything(),
      expect.objectContaining({ headers: { "X-Folder-Id": folderId }, signal }),
    );
    expect((transport.mock.calls[0][1] as FormData).get("file")).toBe(file);
  });

  it("rejects a response that is not READY or belongs to another folder", async () => {
    const client = new ApiClient(
      "http://localhost/api/v1",
      vi.fn() as typeof fetch,
    );
    vi.spyOn(client, "upload").mockResolvedValue({
      ...uploaded,
      folderId: null,
    });
    await expect(
      uploadFile(
        projectId,
        file,
        folderId,
        new AbortController().signal,
        vi.fn(),
        client,
      ),
    ).rejects.toMatchObject({ status: 502 });
  });
});
