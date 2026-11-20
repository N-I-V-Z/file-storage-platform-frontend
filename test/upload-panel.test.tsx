import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UploadPanel } from "../src/features/files/components/upload-panel";
import { uploadFile } from "../src/features/files/api/upload.api";
import { ApiError } from "../src/lib/http/api-client";

vi.mock("../src/features/files/api/upload.api", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../src/features/files/api/upload.api")
    >();
  return { ...actual, uploadFile: vi.fn() };
});

const projectId = "00000000-0000-4000-8000-000000000001";
const folderId = "00000000-0000-4000-8000-000000000002";
const sample = new File(["%PDF-1.7"], "note.pdf", { type: "application/pdf" });

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <UploadPanel userId="user-a" projectId={projectId} folderId={folderId} />
    </QueryClientProvider>,
  );
  return invalidate;
}

describe("UploadPanel", () => {
  beforeEach(() => {
    vi.mocked(uploadFile).mockReset();
  });
  afterEach(cleanup);

  it("accepts several files, reports progress, and refreshes file/usage queries", async () => {
    vi.mocked(uploadFile).mockImplementation(
      async (_id, _file, _folder, _signal, progress) => {
        progress(5, 10);
        return {
          id: "00000000-0000-4000-8000-000000000003",
          projectId,
          folderId,
          originalName: "note.pdf",
          contentType: "application/pdf",
          sizeBytes: 8,
          sha256: "a".repeat(64),
          status: "ready",
          createdAt: "2026-11-20T00:00:00.000Z",
        };
      },
    );
    const invalidate = setup();
    fireEvent.change(screen.getByLabelText(/Tải tệp vào/), {
      target: { files: [sample, sample] },
    });
    await waitFor(() => expect(uploadFile).toHaveBeenCalledTimes(2));
    expect(await screen.findAllByText("Đã tải lên")).toHaveLength(2);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["files", "list", "user-a", projectId],
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["projects", "usage", "user-a", projectId],
    });
  });

  it("keeps quota failures retryable", async () => {
    vi.mocked(uploadFile)
      .mockRejectedValueOnce(new ApiError(413, "Too large"))
      .mockResolvedValueOnce({
        id: "00000000-0000-4000-8000-000000000003",
        projectId,
        folderId,
        originalName: "note.pdf",
        contentType: "application/pdf",
        sizeBytes: 8,
        sha256: "a".repeat(64),
        status: "ready",
        createdAt: "2026-11-20T00:00:00.000Z",
      });
    setup();
    fireEvent.change(screen.getByLabelText(/Tải tệp vào/), {
      target: { files: [sample] },
    });
    expect(await screen.findByText(/vượt hạn mức/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại note.pdf" }));
    expect(await screen.findByText("Đã tải lên")).toBeInTheDocument();
  });

  it("accepts dropped files and rejects unsupported types locally", async () => {
    setup();
    const file = new File(["x"], "note.txt", { type: "text/plain" });
    fireEvent.drop(screen.getByText(/Kéo thả tệp vào đây/).parentElement!, {
      dataTransfer: { files: [file] },
    });
    expect(
      await screen.findByText("Loại tệp chưa được hỗ trợ."),
    ).toBeInTheDocument();
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("aborts the request when the user cancels", async () => {
    const abort = vi.fn();
    vi.mocked(uploadFile).mockImplementation(
      (_id, _file, _folder, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            abort();
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    setup();
    fireEvent.change(screen.getByLabelText(/Tải tệp vào/), {
      target: { files: [sample] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Hủy note.pdf" }));
    await waitFor(() => expect(abort).toHaveBeenCalledOnce());
    expect(await screen.findByText("Đã hủy tải lên.")).toBeInTheDocument();
  });
});
