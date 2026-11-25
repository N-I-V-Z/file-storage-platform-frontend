import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FileExplorer } from "../src/features/files/components/file-explorer";
import { listFiles } from "../src/features/files/api/files.api";
import { listFolders } from "../src/features/files/api/folders.api";
import { moveToTrash } from "../src/features/files/api/trash.api";

vi.mock("../src/features/files/api/files.api", () => ({ listFiles: vi.fn() }));
vi.mock("../src/features/files/api/folders.api", () => ({
  listFolders: vi.fn(),
  createFolder: vi.fn(),
  renameFolder: vi.fn(),
  deleteFolder: vi.fn(),
}));
vi.mock("../src/features/files/api/trash.api", () => ({
  moveToTrash: vi.fn(),
}));

const projectId = "00000000-0000-4000-8000-000000000001";
const otherId = "00000000-0000-4000-8000-000000000002";
const file = {
  id: "00000000-0000-4000-8000-000000000003",
  projectId,
  folderId: null,
  originalName: "report.pdf",
  contentType: "application/pdf" as const,
  sizeBytes: "1536",
  sha256: "a".repeat(64),
  status: "ready" as const,
  createdAt: "2026-11-20T00:00:00.000Z",
};

function setup(id = projectId) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <FileExplorer key={id} userId="user-a" projectId={id} />
    </QueryClientProvider>,
  );
  return { ...view, client };
}

describe("FileExplorer", () => {
  beforeEach(() => {
    vi.mocked(listFiles).mockReset();
    vi.mocked(listFolders).mockResolvedValue([]);
    vi.mocked(moveToTrash).mockReset();
  });
  afterEach(cleanup);

  it("keeps a loading region and shows file metadata after loading", async () => {
    let resolve!: (value: Awaited<ReturnType<typeof listFiles>>) => void;
    vi.mocked(listFiles).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    setup();
    expect(screen.getByText("Đang tải tệp...")).toBeInTheDocument();
    resolve({ items: [file], page: 1, pageSize: 20, total: 1 });
    expect(await screen.findByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText("1,5 KiB")).toBeInTheDocument();
    expect(screen.getByText("1 tệp")).toBeInTheDocument();
  });

  it("applies search/filter/sort and changes server pages", async () => {
    vi.mocked(listFiles).mockImplementation(
      async (_projectId, options = {}) => {
        return {
          items: options.page === 2 ? [] : [file],
          page: options.page ?? 1,
          pageSize: 20,
          total: 21,
        };
      },
    );
    setup();
    await screen.findByText("report.pdf");
    fireEvent.change(screen.getByLabelText("Tìm tệp"), {
      target: { value: "report" },
    });
    fireEvent.change(screen.getByLabelText("Loại tệp"), {
      target: { value: "application/pdf" },
    });
    fireEvent.change(screen.getByLabelText("Sắp xếp"), {
      target: { value: "size-desc" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
    await waitFor(() =>
      expect(listFiles).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          page: 1,
          search: "report",
          contentType: "application/pdf",
          sort: "size-desc",
        }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    await waitFor(() =>
      expect(listFiles).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({ page: 2 }),
      ),
    );
    expect(await screen.findByText("Trang 2 / 2")).toBeInTheDocument();
  });

  it("resets to page one when selecting a folder", async () => {
    vi.mocked(listFolders).mockResolvedValue([
      {
        id: "00000000-0000-4000-8000-000000000004",
        projectId,
        name: "Media",
        createdAt: "2026-11-20T00:00:00.000Z",
        updatedAt: "2026-11-20T00:00:00.000Z",
      },
    ]);
    vi.mocked(listFiles).mockImplementation(async (_id, options = {}) => ({
      items: options.page === 2 ? [] : [file],
      page: options.page ?? 1,
      pageSize: 20,
      total: 21,
    }));
    setup();
    await screen.findByText("report.pdf");
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    await screen.findByText("Trang 2 / 2");
    fireEvent.click(await screen.findByRole("button", { name: "Media" }));
    await waitFor(() =>
      expect(listFiles).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          page: 1,
          folderId: "00000000-0000-4000-8000-000000000004",
        }),
      ),
    );
  });

  it("offers retry when listing fails and distinguishes empty results", async () => {
    vi.mocked(listFiles)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ items: [], page: 1, pageSize: 20, total: 0 });
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không thể tải tệp",
    );
    fireEvent.click(screen.getByRole("button", { name: "Thử tải tệp" }));
    expect(await screen.findByText("Chưa có tệp nào")).toBeInTheDocument();
  });

  it("does not display the previous project's files after a switch", async () => {
    vi.mocked(listFiles).mockImplementation(async (id) => ({
      items: id === projectId ? [file] : [],
      page: 1,
      pageSize: 20,
      total: id === projectId ? 1 : 0,
    }));
    const { rerender, client } = setup();
    await screen.findByText("report.pdf");
    rerender(
      <QueryClientProvider client={client}>
        <FileExplorer key={otherId} userId="user-a" projectId={otherId} />
      </QueryClientProvider>,
    );
    expect(screen.queryByText("report.pdf")).not.toBeInTheDocument();
    expect(await screen.findByText("Chưa có tệp nào")).toBeInTheDocument();
  });

  it("requires inline confirmation before moving a file to trash and refreshes the list", async () => {
    vi.mocked(listFiles)
      .mockResolvedValueOnce({ items: [file], page: 1, pageSize: 20, total: 1 })
      .mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
    vi.mocked(moveToTrash).mockResolvedValue();
    setup();
    await screen.findByText("report.pdf");
    fireEvent.click(
      screen.getByRole("button", { name: "Chuyển report.pdf vào thùng rác" }),
    );
    expect(moveToTrash).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(moveToTrash).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Chuyển report.pdf vào thùng rác" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Chuyển vào thùng rác" }),
    );
    await waitFor(() =>
      expect(moveToTrash).toHaveBeenCalledWith(projectId, file.id),
    );
    expect(await screen.findByText("Chưa có tệp nào")).toBeInTheDocument();
  });
  it("returns to page one after trashing the only file on the last page", async () => {
    vi.mocked(listFiles).mockImplementation(async (_id, options = {}) => {
      const moved = vi.mocked(moveToTrash).mock.calls.length > 0;
      return {
        items: options.page === 2 && !moved ? [file] : [],
        page: options.page ?? 1,
        pageSize: 20,
        total: moved ? 20 : 21,
      };
    });
    vi.mocked(moveToTrash).mockResolvedValue();
    setup();
    await screen.findByText("Trang 1 / 2");
    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    await screen.findByText("report.pdf");
    fireEvent.click(
      screen.getByRole("button", { name: "Chuyển report.pdf vào thùng rác" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Chuyển vào thùng rác" }),
    );
    await waitFor(() =>
      expect(listFiles).toHaveBeenLastCalledWith(
        projectId,
        expect.objectContaining({ page: 1 }),
      ),
    );
  });
});
