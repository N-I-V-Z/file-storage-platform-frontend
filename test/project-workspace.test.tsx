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
  listProjects,
} from "../src/features/projects/api/projects.api";

vi.mock("../src/features/projects/api/projects.api", () => ({
  listProjects: vi.fn(),
  createProject: vi.fn(),
}));
vi.mock("../src/features/api-keys/components/api-key-panel", () => ({
  ApiKeyPanel: () => <div>API keys</div>,
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
});
