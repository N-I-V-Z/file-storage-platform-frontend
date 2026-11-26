import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuditPanel } from "../src/features/audit/components/audit-panel";
import { listAuditEvents } from "../src/features/audit/api/audit.api";

vi.mock("../src/features/audit/api/audit.api", () => ({
  listAuditEvents: vi.fn(),
}));

const projectId = "00000000-0000-4000-8000-000000000001";
const event = {
  id: "00000000-0000-4000-8000-000000000002",
  projectId,
  actorType: "API_KEY" as const,
  actorId: "00000000-0000-4000-8000-000000000003",
  action: "FILE_UPLOADED" as const,
  resourceId: "00000000-0000-4000-8000-000000000004",
  occurredAt: "2026-11-26T10:00:00.000Z",
};

function setup(selectedProject = projectId) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AuditPanel
        key={selectedProject}
        userId="user-a"
        projectId={selectedProject}
      />
    </QueryClientProvider>,
  );
}

describe("AuditPanel", () => {
  beforeEach(() => {
    vi.mocked(listAuditEvents).mockReset();
  });
  afterEach(cleanup);

  it("shows the action and actor without any secret or filename", async () => {
    vi.mocked(listAuditEvents).mockResolvedValue({
      items: [event],
      total: 1,
      page: 1,
      pageSize: 10,
    });
    setup();
    expect(await screen.findByText("Tải tệp lên")).toBeInTheDocument();
    expect(screen.getByText("API key 00000000")).toBeInTheDocument();
    expect(screen.getByText("Trang 1/1 · 1 hoạt động")).toBeInTheDocument();
    expect(screen.queryByTitle(event.resourceId)).not.toBeInTheDocument();
    expect(screen.queryByText("private-document.pdf")).not.toBeInTheDocument();
  });

  it("paginates and loads each page for the selected project", async () => {
    vi.mocked(listAuditEvents).mockImplementation(async (_project, page) => ({
      items:
        page === 1
          ? [event]
          : [
              {
                ...event,
                id: "00000000-0000-4000-8000-000000000005",
                action: "FILE_PURGED" as const,
              },
            ],
      total: 11,
      page,
      pageSize: 10,
    }));
    setup();
    expect(await screen.findByText("Tải tệp lên")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sau" }));
    expect(await screen.findByText("Đã xóa vĩnh viễn")).toBeInTheDocument();
    expect(listAuditEvents).toHaveBeenCalledWith(projectId, 2);
    expect(screen.getByText("Trang 2/2 · 11 hoạt động")).toBeInTheDocument();
  });

  it("keeps project context and offers retry after a failed request", async () => {
    vi.mocked(listAuditEvents)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ items: [], total: 0, page: 1, pageSize: 10 });
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không thể tải lịch sử hoạt động",
    );
    expect(
      screen.getByRole("heading", { name: "Lịch sử hoạt động" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() =>
      expect(screen.getByText("Chưa có hoạt động nào.")).toBeInTheDocument(),
    );
  });

  it("clears the previous project history on selection change", async () => {
    const otherProject = "00000000-0000-4000-8000-000000000099";
    vi.mocked(listAuditEvents).mockImplementation(async (selectedProject) => {
      if (selectedProject === projectId)
        return { items: [event], total: 1, page: 1, pageSize: 10 };
      return { items: [], total: 0, page: 1, pageSize: 10 };
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = render(
      <QueryClientProvider client={client}>
        <AuditPanel key={projectId} userId="user-a" projectId={projectId} />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Tải tệp lên")).toBeInTheDocument();
    view.rerender(
      <QueryClientProvider client={client}>
        <AuditPanel
          key={otherProject}
          userId="user-a"
          projectId={otherProject}
        />
      </QueryClientProvider>,
    );
    expect(screen.queryByText("Tải tệp lên")).not.toBeInTheDocument();
    expect(
      await screen.findByText("Chưa có hoạt động nào."),
    ).toBeInTheDocument();
  });
});
