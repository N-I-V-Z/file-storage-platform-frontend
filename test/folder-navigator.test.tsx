import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FolderNavigator } from "../src/features/files/components/folder-navigator";
import {
  createFolder,
  deleteFolder,
  listFolders,
  renameFolder,
} from "../src/features/files/api/folders.api";
import { ApiError } from "../src/lib/http/api-client";

vi.mock("../src/features/files/api/folders.api", () => ({
  listFolders: vi.fn(),
  createFolder: vi.fn(),
  renameFolder: vi.fn(),
  deleteFolder: vi.fn(),
}));

const projectId = "00000000-0000-4000-8000-000000000001";
const folder = {
  id: "00000000-0000-4000-8000-000000000002",
  projectId,
  name: "Media",
  createdAt: "2026-11-20T00:00:00.000Z",
  updatedAt: "2026-11-20T00:00:00.000Z",
};

function setup(onSelect = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <FolderNavigator
        userId="user-a"
        projectId={projectId}
        selectedId={undefined}
        onSelect={onSelect}
      />
    </QueryClientProvider>,
  );
  return onSelect;
}

describe("FolderNavigator", () => {
  beforeEach(() => {
    vi.mocked(listFolders).mockReset().mockResolvedValue([folder]);
    vi.mocked(createFolder).mockReset().mockResolvedValue(folder);
    vi.mocked(renameFolder).mockReset().mockResolvedValue(folder);
    vi.mocked(deleteFolder).mockReset().mockResolvedValue();
  });
  afterEach(cleanup);

  it("selects root or a folder and validates a new name", async () => {
    const onSelect = setup();
    fireEvent.click(screen.getByRole("button", { name: "Chưa phân loại" }));
    expect(onSelect).toHaveBeenCalledWith("root");
    fireEvent.click(await screen.findByRole("button", { name: "Media" }));
    expect(onSelect).toHaveBeenCalledWith(folder.id);
    fireEvent.click(screen.getByRole("button", { name: /Tạo folder/ }));
    fireEvent.change(screen.getByLabelText("Tên folder mới"), {
      target: { value: "../bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu folder" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "không được chứa",
    );
    expect(createFolder).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Tên folder mới"), {
      target: { value: "Assets" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu folder" }));
    await waitFor(() =>
      expect(createFolder).toHaveBeenCalledWith(projectId, { name: "Assets" }),
    );
  });

  it("renames, and requires confirmation before delete", async () => {
    setup();
    fireEvent.click(
      await screen.findByRole("button", { name: "Đổi tên Media" }),
    );
    fireEvent.change(screen.getByLabelText("Tên folder"), {
      target: { value: "Assets" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu folder" }));
    await waitFor(() =>
      expect(renameFolder).toHaveBeenCalledWith(projectId, folder.id, {
        name: "Assets",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Xóa Media" }));
    expect(deleteFolder).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận xóa" }));
    await waitFor(() =>
      expect(deleteFolder).toHaveBeenCalledWith(projectId, folder.id),
    );
  });

  it("explains nonempty-folder deletion conflicts and keeps retry available", async () => {
    vi.mocked(deleteFolder).mockRejectedValue(new ApiError(409, "Conflict"));
    setup();
    fireEvent.click(await screen.findByRole("button", { name: "Xóa Media" }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận xóa" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Folder còn tệp",
    );
    expect(screen.getByRole("button", { name: "Xác nhận xóa" })).toBeEnabled();
  });
});
