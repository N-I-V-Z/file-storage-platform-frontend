import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectWorkspace } from "../src/features/projects/components/project-workspace";
import {
  createProject,
  getProjectUsage,
  getProjectUsageBreakdown,
  listProjects,
} from "../src/features/projects/api/projects.api";

vi.mock("../src/features/projects/api/projects.api", () => ({
  listProjects: vi.fn(),
  createProject: vi.fn(),
  getProjectUsage: vi.fn(),
  getProjectUsageBreakdown: vi.fn(),
}));
vi.mock("../src/features/api-keys/components/api-key-panel", () => ({
  ApiKeyPanel: () => <div>API keys</div>,
}));
vi.mock("../src/features/files/components/file-explorer", () => ({
  FileExplorer: () => <div>File Explorer</div>,
}));
vi.mock("../src/features/files/components/trash-panel", () => ({
  TrashPanel: () => <div>Thùng rác</div>,
}));

const project = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Media",
  createdAt: "2026-11-19T00:00:00.000Z",
  updatedAt: "2026-11-19T00:00:00.000Z",
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ProjectWorkspace userId="user-a" />
    </QueryClientProvider>,
  );
}

describe("ProjectWorkspace", () => {
  beforeEach(() => {
    vi.mocked(listProjects).mockReset();
    vi.mocked(createProject).mockReset();
    vi.mocked(getProjectUsage).mockReset();
    vi.mocked(getProjectUsageBreakdown).mockReset();
    vi.mocked(getProjectUsage).mockImplementation(async (projectId) => ({
      projectId,
      quotaBytes: "10737418240",
      usedBytes: "0",
      reservedBytes: "0",
    }));
    vi.mocked(getProjectUsageBreakdown).mockImplementation(
      async (projectId) => ({
        projectId,
        quotaBytes: "10737418240",
        usedBytes: "0",
        reservedBytes: "0",
        readyBytes: "0",
        trashBytes: "0",
        pendingBytes: "0",
        matchesBalance: true,
      }),
    );
  });
  afterEach(cleanup);

  it("creates a project from the empty state and selects it", async () => {
    vi.mocked(listProjects).mockResolvedValue([]);
    vi.mocked(createProject).mockResolvedValue(project);
    setup();
    expect(await screen.findByText("Chưa có project nào")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tạo project" }));
    fireEvent.change(screen.getByLabelText("Tên project"), {
      target: { value: "  Media  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu project" }));
    await waitFor(() =>
      expect(createProject).toHaveBeenCalledWith({ name: "Media" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Media" }),
    ).toBeInTheDocument();
  });

  it("offers retry when the project list fails", async () => {
    vi.mocked(listProjects)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([project]);
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không thể tải project",
    );
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(
      await screen.findByRole("heading", { name: "Media" }),
    ).toBeInTheDocument();
  });

  it("switches between owned projects", async () => {
    const other = {
      ...project,
      id: "00000000-0000-4000-8000-000000000002",
      name: "Documents",
    };
    vi.mocked(listProjects).mockResolvedValue([project, other]);
    setup();
    expect(
      await screen.findByRole("heading", { name: "Media" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Documents" }));
    expect(
      screen.getByRole("heading", { name: "Documents" }),
    ).toBeInTheDocument();
  });

  it("shows usage for the selected project and replaces it on selection", async () => {
    const other = {
      ...project,
      id: "00000000-0000-4000-8000-000000000002",
      name: "Documents",
    };
    vi.mocked(listProjects).mockResolvedValue([project, other]);
    vi.mocked(getProjectUsage).mockImplementation(async (projectId) => ({
      projectId,
      quotaBytes: "10737418240",
      usedBytes: projectId === project.id ? "5368709120" : "1073741824",
      reservedBytes: "1048576",
    }));
    setup();
    expect(await screen.findByText("5 GiB / 10 GiB")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
    fireEvent.click(screen.getByRole("button", { name: "Documents" }));
    expect(await screen.findByText("1 GiB / 10 GiB")).toBeInTheDocument();
    expect(screen.queryByText("5 GiB / 10 GiB")).not.toBeInTheDocument();
    expect(getProjectUsage).toHaveBeenCalledWith(other.id);
  });

  it("offers a usage retry without hiding project details", async () => {
    vi.mocked(listProjects).mockResolvedValue([project]);
    vi.mocked(getProjectUsage)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        projectId: project.id,
        quotaBytes: "10737418240",
        usedBytes: "0",
        reservedBytes: "0",
      });
    setup();
    expect(
      await screen.findByText("Không thể tải dung lượng."),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Media" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử tải dung lượng" }));
    expect(await screen.findByText("0 B / 10 GiB")).toBeInTheDocument();
  });

  it("keeps project controls visible while usage loads", async () => {
    vi.mocked(listProjects).mockResolvedValue([project]);
    vi.mocked(getProjectUsage).mockReturnValue(new Promise(() => {}));
    setup();
    expect(await screen.findByText("Đang tải dung lượng...")).toHaveAttribute(
      "role",
      "status",
    );
    expect(screen.getByRole("heading", { name: "Media" })).toBeInTheDocument();
    expect(screen.getByText("API keys")).toBeInTheDocument();
  });

  it("shows the three usage buckets and warns when counters disagree", async () => {
    vi.mocked(listProjects).mockResolvedValue([project]);
    vi.mocked(getProjectUsageBreakdown).mockResolvedValue({
      projectId: project.id,
      quotaBytes: "10737418240",
      usedBytes: "5368709120",
      reservedBytes: "1048576",
      readyBytes: "4294967296",
      trashBytes: "1073741824",
      pendingBytes: "1048576",
      matchesBalance: false,
    });
    setup();
    expect(await screen.findByText("4 GiB")).toBeInTheDocument();
    expect(screen.getByText("1 GiB")).toBeInTheDocument();
    expect(screen.getByText("1 MiB")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Số liệu dung lượng chưa khớp",
    );
  });

  it("keeps the summary visible and retries a failed breakdown", async () => {
    vi.mocked(listProjects).mockResolvedValue([project]);
    vi.mocked(getProjectUsageBreakdown)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        projectId: project.id,
        quotaBytes: "10737418240",
        usedBytes: "0",
        reservedBytes: "0",
        readyBytes: "0",
        trashBytes: "0",
        pendingBytes: "0",
        matchesBalance: true,
      });
    setup();
    expect(
      await screen.findByText("Không thể tải chi tiết dung lượng."),
    ).toBeInTheDocument();
    expect(screen.getByText("0 B / 10 GiB")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử tải chi tiết" }));
    expect(await screen.findByText("Tệp đang dùng")).toBeInTheDocument();
  });

  it("clears the previous project's breakdown when selection changes", async () => {
    const other = {
      ...project,
      id: "00000000-0000-4000-8000-000000000002",
      name: "Documents",
    };
    vi.mocked(listProjects).mockResolvedValue([project, other]);
    vi.mocked(getProjectUsageBreakdown).mockImplementation(
      async (projectId) => ({
        projectId,
        quotaBytes: "10737418240",
        usedBytes: projectId === project.id ? "4294967296" : "1073741824",
        reservedBytes: "0",
        readyBytes: projectId === project.id ? "4294967296" : "1073741824",
        trashBytes: "0",
        pendingBytes: "0",
        matchesBalance: true,
      }),
    );
    setup();
    expect(await screen.findByText("4 GiB")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Documents" }));
    expect(screen.queryByText("4 GiB")).not.toBeInTheDocument();
    expect(await screen.findByText("1 GiB")).toBeInTheDocument();
  });
});
