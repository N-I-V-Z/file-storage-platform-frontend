import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SharePanel } from "../src/features/share-links/components/share-panel";
import {
  createShareLink,
  listShareLinks,
  revokeShareLink,
} from "../src/features/share-links/api/share-links.api";

vi.mock("../src/features/share-links/api/share-links.api", () => ({
  createShareLink: vi.fn(),
  listShareLinks: vi.fn(),
  revokeShareLink: vi.fn(),
}));

const file = {
  id: "00000000-0000-4000-8000-000000000003",
  projectId: "00000000-0000-4000-8000-000000000001",
  folderId: null,
  originalName: "report.pdf",
  contentType: "application/pdf" as const,
  sizeBytes: "5",
  sha256: "a".repeat(64),
  status: "ready" as const,
  createdAt: "2026-11-27T00:00:00.000Z",
};
const link = {
  id: "00000000-0000-4000-8000-000000000004",
  fileId: file.id,
  createdAt: "2026-11-27T00:00:00.000Z",
  expiresAt: "2099-11-28T00:00:00.000Z",
  revokedAt: null,
};

function show() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SharePanel
        userId="user-a"
        projectId={file.projectId}
        file={file}
        onClose={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

describe("SharePanel", () => {
  beforeEach(() => {
    vi.mocked(listShareLinks).mockReset().mockResolvedValue([]);
    vi.mocked(createShareLink).mockReset();
    vi.mocked(revokeShareLink).mockReset().mockResolvedValue();
  });

  it("shows a new secret only after creation and revokes a metadata link", async () => {
    vi.mocked(createShareLink).mockResolvedValue({
      ...link,
      token: `fsps_${"A".repeat(43)}`,
    });
    vi.mocked(listShareLinks).mockResolvedValue([link]);
    show();
    expect(
      screen.queryByLabelText("Link mới (chỉ hiển thị lần này)"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tạo link" }));
    expect(
      (
        (await screen.findByLabelText(
          "Link mới (chỉ hiển thị lần này)",
        )) as HTMLInputElement
      ).value,
    ).toContain("/share#fsps_");
    expect(createShareLink).toHaveBeenCalledWith(file.projectId, file.id, 24);
    fireEvent.click(screen.getByRole("button", { name: "Thu hồi" }));
    await waitFor(() =>
      expect(revokeShareLink).toHaveBeenCalledWith(
        file.projectId,
        file.id,
        link.id,
      ),
    );
    await waitFor(() =>
      expect(
        screen.queryByLabelText("Link mới (chỉ hiển thị lần này)"),
      ).not.toBeInTheDocument(),
    );
  });
});
