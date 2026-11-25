import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/lib/http/api-client";
import { TrashPanel } from "../src/features/files/components/trash-panel";
import {
  listTrash,
  purgeTrash,
  restoreTrash,
} from "../src/features/files/api/trash.api";

vi.mock("../src/features/files/api/trash.api", () => ({
  listTrash: vi.fn(),
  purgeTrash: vi.fn(),
  restoreTrash: vi.fn(),
}));

const projectId = "00000000-0000-4000-8000-000000000001";
const item = {
  id: "00000000-0000-4000-8000-000000000002",
  projectId,
  folderId: null,
  originalName: "report.pdf",
  contentType: "application/pdf" as const,
  sizeBytes: "1536",
  status: "trashed" as const,
  createdAt: "2026-11-20T00:00:00.000Z",
  trashedAt: "2026-11-21T00:00:00.000Z",
  purgeAfter: "2026-12-21T00:00:00.000Z",
};

function setup(project = projectId) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TrashPanel key={project} userId="user-a" projectId={project} />
    </QueryClientProvider>,
  );
}

describe("TrashPanel", () => {
  beforeEach(() => {
    vi.mocked(listTrash).mockReset();
    vi.mocked(restoreTrash).mockReset();
    vi.mocked(purgeTrash).mockReset();
  });
  afterEach(cleanup);

  it("shows retention and restores a file, refreshing the list", async () => {
    vi.mocked(listTrash)
      .mockResolvedValueOnce({ items: [item], page: 1, pageSize: 20, total: 1 })
      .mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
    vi.mocked(restoreTrash).mockResolvedValue({ id: item.id, status: "ready" });
    setup();
    expect(await screen.findByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText(/21\/12\/2026/)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Khôi phục report.pdf" }),
    );
    await waitFor(() =>
      expect(restoreTrash).toHaveBeenCalledWith(projectId, item.id),
    );
    expect(await screen.findByText("Thùng rác trống")).toBeInTheDocument();
  });

  it("confirms permanent purge and preserves the row when the server fails", async () => {
    vi.mocked(listTrash).mockResolvedValue({
      items: [item],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    vi.mocked(purgeTrash).mockRejectedValue(new Error("offline"));
    setup();
    await screen.findByText("report.pdf");
    fireEvent.click(
      screen.getByRole("button", { name: "Xóa vĩnh viễn report.pdf" }),
    );
    expect(purgeTrash).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Xóa vĩnh viễn" }));
    await waitFor(() =>
      expect(purgeTrash).toHaveBeenCalledWith(projectId, item.id),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Không thể xóa vĩnh viễn",
    );
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });
  it("refreshes a purge claimed for background retry after a 503 response", async () => {
    vi.mocked(listTrash)
      .mockResolvedValueOnce({ items: [item], page: 1, pageSize: 20, total: 1 })
      .mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
    vi.mocked(purgeTrash).mockRejectedValue(
      new ApiError(503, "Máy chủ đang gặp sự cố."),
    );
    setup();
    await screen.findByText("report.pdf");
    fireEvent.click(
      screen.getByRole("button", { name: "Xóa vĩnh viễn report.pdf" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Xóa vĩnh viễn" }));
    expect(await screen.findByText("Thùng rác trống")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Hệ thống sẽ tự thử lại",
    );
  });
});
