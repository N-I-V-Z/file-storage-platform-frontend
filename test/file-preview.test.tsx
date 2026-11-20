import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilePreview } from "../src/features/files/components/file-preview";
import { fetchPreview } from "../src/features/files/api/download.api";
import type { StoredFile } from "../src/features/files/schemas/files.schemas";

vi.mock("../src/features/files/api/download.api", () => ({
  fetchPreview: vi.fn(),
}));
const file: StoredFile = {
  id: "00000000-0000-4000-8000-000000000002",
  projectId: "00000000-0000-4000-8000-000000000001",
  folderId: null,
  originalName: "image.png",
  contentType: "image/png",
  sizeBytes: "4",
  sha256: "a".repeat(64),
  status: "ready",
  createdAt: "2026-11-20T00:00:00.000Z",
};

describe("FilePreview", () => {
  beforeEach(() => {
    vi.mocked(fetchPreview)
      .mockReset()
      .mockResolvedValue(new Blob(["DATA"], { type: "image/png" }));
    const OriginalURL = URL;
    class MockURL extends OriginalURL {
      static createObjectURL = vi.fn(() => "blob:test");
      static revokeObjectURL = vi.fn();
    }
    vi.stubGlobal("URL", MockURL);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("creates a temporary URL and revokes it on close", async () => {
    const close = vi.fn();
    const view = render(
      <FilePreview projectId={file.projectId} file={file} onClose={close} />,
    );
    expect(await screen.findByAltText("image.png")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đóng xem trước" }));
    expect(close).toHaveBeenCalledOnce();
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
});
