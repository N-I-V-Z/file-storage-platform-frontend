import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiClient } from "../src/lib/http/api-client";

class FakeXhr {
  static instances: FakeXhr[] = [];
  upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  withCredentials = false;
  responseText = "";
  status = 0;
  url = "";
  headers = new Map<string, string>();
  sent: Document | XMLHttpRequestBodyInit | null = null;

  constructor() {
    FakeXhr.instances.push(this);
  }
  open(_method: string, url: string) {
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers.set(name, value);
  }
  send(body: Document | XMLHttpRequestBodyInit | null) {
    this.sent = body;
  }
  abort() {
    this.onabort?.();
  }
  respond(status: number, body: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.onload?.();
  }
}

describe("multipart transport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeXhr.instances = [];
  });

  it("keeps the bearer token in a header and emits upload progress", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    const client = new ApiClient(
      "http://localhost/api/v1",
      vi.fn() as typeof fetch,
    );
    client.setAccessToken("private-token");
    const progress = vi.fn();
    const promise = client.upload(
      "/projects/p/files",
      new FormData(),
      z.object({ id: z.string() }),
      {
        headers: { "X-Folder-Id": "folder" },
        signal: new AbortController().signal,
        onProgress: progress,
      },
    );
    const xhr = FakeXhr.instances[0];
    expect(xhr.url).toBe("http://localhost/api/v1/projects/p/files");
    expect(xhr.headers.get("Authorization")).toBe("Bearer private-token");
    expect(xhr.headers.get("X-Folder-Id")).toBe("folder");
    expect(xhr.headers.has("Content-Type")).toBe(false);
    expect(xhr.withCredentials).toBe(true);
    xhr.upload.onprogress?.({
      lengthComputable: true,
      loaded: 3,
      total: 10,
    } as ProgressEvent);
    xhr.respond(201, {
      success: true,
      data: { id: "file" },
      timestamp: "2026-11-20T00:00:00.000Z",
    });
    await expect(promise).resolves.toEqual({ id: "file" });
    expect(progress).toHaveBeenCalledWith(3, 10);
  });

  it("aborts the active XHR and never treats an error as a file", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    const client = new ApiClient(
      "http://localhost/api/v1",
      vi.fn() as typeof fetch,
    );
    const controller = new AbortController();
    const promise = client.upload("/files", new FormData(), z.string(), {
      signal: controller.signal,
      onProgress: vi.fn(),
    });
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    const error = client.upload("/files", new FormData(), z.string(), {
      signal: new AbortController().signal,
      onProgress: vi.fn(),
    });
    FakeXhr.instances[1].respond(413, { success: false });
    await expect(error).rejects.toMatchObject({ status: 413 });
  });
});
